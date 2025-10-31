// Global variables
const dendroWidth = 150;
const cellSize = 20;
const glyphWidth = 500;
const clusterWidth = 500;

// Predefine cluster IDs
const cluster1Ids = [17, 19];
const cluster2Ids1 = [13, 18, 0, 9, 11, 3, 15, 10, 14, 12];
const cluster2Ids2 = [1, 5, 2, 8, 6, 16, 4, 7];

function init() {
    // Load both heatmap and dendrogram data
    Promise.all([
        fetch('data/heatmap_data.json').then(r => r.json()),
        fetch('data/dendro_data.json').then(r => r.json())
    ])
        .then(([heatmapData, dendroData]) => {
            createVisualization(heatmapData, dendroData);
        })
        .catch(error => {
            console.error('Error loading data:', error);
            const container = document.getElementById('heatmapContainer');
            container.innerHTML = '<p style="color: white; text-align: center;">Error loading data. Please ensure heatmap_data.json and dendro_data.json are in the same directory.</p>';
        });
}

// Color scale for heatmap
const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([0, 1]);

/**
 * Create the complete visualization with dendrogram overlaid on heatmap
 */
function createVisualization(heatmapData, dendroData) {

    const root = d3.hierarchy(dendroData);
    const dendroMaxDist = dendroData.dist;
    const distScale = dendroWidth / dendroMaxDist;

    const numRowsDendro = root.leaves().length;
    const dendroHeight = cellSize * numRowsDendro;

    const cluster = d3.cluster()
        .size([dendroHeight, dendroWidth])
        .separation(() => 1);

    cluster(root);

    // Scale the dendrogram according to the distance between the nodes
    root.descendants().forEach((node, index) => {
        node.y = (dendroMaxDist - node.data.dist) * distScale;
    });

    const rows = [...new Set(heatmapData.map(d => d.row))];
    const cols = [...new Set(heatmapData.map(d => d.col))];

    const margin = { top: 50, right: 250, bottom: 50, left: 100 }; // Adjusted margin for dendrogram alignment
    const width = cols.length * cellSize + margin.left + margin.right + clusterWidth;
    const height = rows.length * cellSize + margin.top + margin.bottom;

    const yScale = d3.scaleLinear()
        .domain([d3.min(root.descendants(), d => d.x), d3.max(root.descendants(), d => d.x)]) // Scale tree's height
        .range([margin.top + cellSize / 2, height - margin.bottom - cellSize / 2]); // Map to heatmap's height

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(root.descendants(), d => d.y)]) // Depth of dendrogram
        .range([margin.left, width - margin.right - clusterWidth]); // Align with heatmap width

    const minScore = d3.min(heatmapData, d => d.score);
    const maxScore = d3.max(heatmapData, d => d.score);

    const heatmap_colorscale = d3.scaleSequential(d3.interpolateBlues)
        .domain([maxScore, minScore]);

    let _svg = d3.select("#clusterDemoSvg")
        .attr("width", width)
        .attr("height", height);

    // Clear any existing content
    _svg.selectAll("*").remove();

    // Create a main group that will be panned
    const svg = _svg.append('g');

    // Setup zoom behavior (pan only, no zoom)
    const zoom = d3.zoom()
        .scaleExtent([.7, 1])  // Lock zoom at 1x (pan only)
        .on('zoom', (event) => {
            svg.attr('transform', event.transform);
        });

    // Apply zoom to SVG
    _svg.call(zoom);

    // Create heatmap group
    const heatmapG = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Draw heatmap
    heatmapG.selectAll(".cell")
        .data(heatmapData)
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("x", d => (cols.indexOf(d.col)) * cellSize)
        .attr("y", d => (rows.indexOf(d.row)) * cellSize)
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("fill", d => heatmap_colorscale(d.score))
        .attr("stroke", "rgba(255,255,255,0.2)")
        .attr("stroke-width", 0.5);

    // Create dendrogram group
    const dendroG = svg.append("g");

    // Draw dendrogram links
    dendroG.selectAll(".dendro-link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "dendrogram-link")
        .attr("id", d => `dendrogram-link-${d.source.data.id}-${d.target.data.id}`)
        .attr("d", d => {
            return `M${xScale(d.source.y)},${yScale(d.source.x)}V${yScale(d.target.x)}H${xScale(d.target.y)}`;
        })

    dendroG.selectAll("circle")
        .data(root.descendants())
        .enter()
        .append("circle")
        .attr("class", "dendrogram-node")
        .attr("id", d => `dendrogram-node-${d.data.id}`)
        .attr("cx", d => xScale(d.y))
        .attr("cy", d => yScale(d.x))

    // Add color legend (horizontal)
    const legendWidth = 20;  // Swapped: now this is the thickness
    const legendHeight = 250; // Swapped: now this is the length
    const legendX = 18; // Position to the right of heatmap
    const legendY = margin.top; // Align with top of heatmap

    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
        .attr('id', 'legend-gradient')
        .attr('x1', '0%')
        .attr('x2', '0%')  // Changed from 100% to 0%
        .attr('y1', '0%')  // Top of gradient
        .attr('y2', '100%'); // Changed from 0% to 100% (gradient flows downward)

    gradient.selectAll('stop')
        .data(d3.range(0, 1.01, 0.01))
        .enter()
        .append('stop')
        .attr('offset', d => (d * 100) + '%')
        .attr('stop-color', d => heatmap_colorscale(d));

    // Legend rectangle (vertical)
    svg.append('rect')
        .attr('x', legendX)
        .attr('y', legendY)
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#legend-gradient)');

    // Legend  label vertical
    svg.append('text')
        .attr('class', 'legend-label')
        .attr('x', legendX + legendWidth + 25)
        .attr('y', legendHeight / 2)
        .attr('transform', `rotate(-90,${legendX + legendWidth + 25},${legendY + legendHeight / 2})`)
        .text('DTW Score')
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .attr('fill', 'black');

    // Arrow gradient
    const arrow_gradient = defs.append('linearGradient')
        .attr('id', 'gradient-gray-black') // Unique ID for the gradient
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%') // Horizontal gradient from left to right
        .attr('y2', '0%');
    arrow_gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', 'lightgray'); // Start color
    arrow_gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'black'); // End color
    defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('markerWidth', 5) // Width of the marker
        .attr('markerHeight', 5) // Height of the marker
        .attr('refX', 5) // Position of the tip (aligned with the path end)
        .attr('refY', 2.5) // Center the arrowhead vertically
        .attr('orient', 'auto') // Orient automatically based on the path
        .append('path')
        .attr('d', 'M 0 0 L 5 2.5 L 0 5 Z') // Triangle shape
        .attr('fill', 'black');

    // Create cluster shapes
    const shapeWidth = 100;
    const shapeHeight = 100;
    const triangleWidthMax = 300;
    const triangleHeightMax = 100;



    // Create a group for all shapes
    const shapesGroup1 = svg.append('g')
        .attr('class', 'cluster-group')
        .attr('id', 'main-cluster')
        .attr('transform', `translate(${margin.left + glyphWidth}, ${margin.top})`)

    // Add connecting lines BEFORE triangles (so triangles appear on top)
    const lineGroup = shapesGroup1.append('g')
        .attr('class', 'connecting-lines');

    // Line from middle of the dendrogram to the first triangle
    lineGroup.append('path')
        .attr('class', 'connecting-line')
        .attr('d', `
            M 0,${triangleHeightMax}
            V ${triangleHeightMax / 2}
            H 98
        `)
        .on('mouseover', function (d) {
            d3.select(`#dendrogram-link-38-36`)
                .classed('hovered', true);
        })
        .on('mouseout', function (d) {
            d3.select(`#dendrogram-link-38-36`)
                .classed('hovered', false);
        });
    // Line from middle of the dendrogram to the second triangle
    lineGroup.append('path')
        .attr('class', 'connecting-line')
        .attr('d', `
            M 0,${triangleHeightMax}
            V ${triangleHeightMax + triangleHeightMax / 2}
            H 100
        `)
        .on('mouseover', function (d) {
            d3.select(`#dendrogram-link-38-37`)
                .classed('hovered', true);
        })
        .on('mouseout', function (d) {
            d3.select(`#dendrogram-link-38-37`)
                .classed('hovered', false);
        });

    // Append circles at the midpoints
    lineGroup.append('circle')
        .attr('class', 'dendrogram-node')
        .attr('cx', 98)
        .attr('cy', triangleHeightMax / 2)
    lineGroup.append('circle')
        .attr('class', 'dendrogram-node')
        .attr('cx', 100)
        .attr('cy', triangleHeightMax + triangleHeightMax / 2)
    lineGroup.append('circle')
        .attr('class', 'dendrogram-node')
        .attr('cx', 0)
        .attr('cy', triangleHeightMax)

    // Highlight rectangles 1 and 2
    const highlightGroup = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)

    const highlightRect1 = highlightGroup.append('rect')
        .attr('class', 'highlight-rect')
        .attr('id', 'highlight-rect-1')
        .attr('x', 6 * cellSize - cellSize / 2)
        .attr('y', -cellSize / 2)
        .attr('width', 15 * cellSize)
        .attr('height', 3 * cellSize - cellSize / 2)

    const highlightRect2 = highlightGroup.append('rect')
        .attr('class', 'highlight-rect')
        .attr('id', 'highlight-rect-2')
        .attr('x', 6 * cellSize - cellSize / 2)
        .attr('y', 2 * cellSize)
        .attr('width', 15 * cellSize)
        .attr('height', 18 * cellSize + cellSize / 2)

    // Triangles
    const triangleC1 = shapesGroup1.append('polygon')
        .attr('class', 'glyph glyph-triangle')
        .attr('points', `98,${triangleHeightMax / 2}
            ${triangleWidthMax},${triangleHeightMax / 2 - 7}
            ${triangleWidthMax},${triangleHeightMax / 2 + 7}
            `)
        .on('mouseover', function (d) {
            d3.select(this).raise();
            d3.select('#highlight-rect-1')
                .classed('hovered', true);
        })
        .on('mouseout', function (d) {
            d3.select('#highlight-rect-1')
                .classed('hovered', false);
        });

    const triangleC2 = shapesGroup1.append('polygon')
        .attr('class', 'glyph glyph-triangle glyph-interactive glyph-clickable')
        .attr('transform', `translate(0, ${triangleHeightMax})`)
        .attr('points', `100,${triangleHeightMax / 2}
            ${triangleWidthMax},${triangleHeightMax / 2 - 48}
            ${triangleWidthMax},${triangleHeightMax / 2 + 48}
            `)
        .on('mouseover', function (d) {
            d3.select(this).raise();
            d3.select('#highlight-rect-2')
                .classed('hovered', true);
        })
        .on('mouseout', function (d) {
            d3.select('#highlight-rect-2')
                .classed('hovered', false);
        });

    // Create a color scale for conciseness, min value is 0.38 and max value is 7.7
    const colorScaleIntra = d3.scaleSequential(d3.interpolateOranges)
        .domain([0.38, 7.66]);

    const squareC1 = shapesGroup1.append('rect')
        .attr('class', 'glyph glyph-square glyph-interactive')
        .datum(0.38)
        .attr('x', triangleWidthMax)
        .attr('y', 0)
        .attr('width', shapeWidth)
        .attr('height', shapeHeight)
        .attr('fill', d => colorScaleIntra(d))
        .on('mouseover', function (d) {
            d3.select(this).raise();
            const leafIds = root.leaves()
                .filter(leaf => cluster1Ids.includes(leaf.data.id))
                .map(leaf => `#dendrogram-node-${leaf.data.id}`)
                .join(',');

            d3.selectAll(leafIds)
                .classed('hovered', true);
        })
        .on('mouseout', function (d) {
            const leafIds = root.leaves()
                .filter(leaf => cluster1Ids.includes(leaf.data.id))
                .map(leaf => `#dendrogram-node-${leaf.data.id}`)
                .join(',');

            d3.selectAll(leafIds)
                .classed('hovered', false);
        });

    const squareC2 = shapesGroup1.append('rect')
        .attr('class', 'glyph glyph-square glyph-interactive')
        .datum(7.66)
        .attr('x', triangleWidthMax + shapeWidth)
        .attr('y', shapeHeight)
        .attr('width', shapeWidth)
        .attr('height', shapeHeight)
        .attr('fill', d => colorScaleIntra(d))
        .attr('stroke', 'black')
        .attr('stroke-width', 2)
        .on('mouseover', function (d) {
            d3.select(this).raise();
            const leafIds = root.leaves()
                .filter(leaf => !cluster1Ids.includes(leaf.data.id))
                .map(leaf => `#dendrogram-node-${leaf.data.id}`)
                .join(',');

            d3.selectAll(leafIds)
                .classed('hovered', true);
        })
        .on('mouseout', function (d) {
            const leafIds = root.leaves()
                .filter(leaf => !cluster1Ids.includes(leaf.data.id))
                .map(leaf => `#dendrogram-node-${leaf.data.id}`)
                .join(',');

            d3.selectAll(leafIds)
                .classed('hovered', false);
        });

    // Define the diagonal stripe pattern
    const striped_pattern = defs.append("pattern")
        .attr("id", "diagonal-stripe-3")
        .attr("patternUnits", "userSpaceOnUse")
        .attr('patternTransform', 'rotate(45)') // Rotate for diagonal stripes
        .attr("width", 6)
        .attr("height", 12);
    // Add white background
    striped_pattern
        .append('rect')
        .attr("x", 0)
        .attr("y", 0)
        .attr('width', 6)
        .attr('height', 12)
        .attr('fill', 'white');
    // Add black stripe
    striped_pattern
        .append('rect')
        .attr("x", 0)
        .attr("y", 0)
        .attr('width', 2)
        .attr('height', 12)
        .attr('fill', 'black');

    const squareC3 = shapesGroup1.append('rect')
        .attr('class', 'glyph glyph-square')
        .attr('x', triangleWidthMax)
        .attr('y', shapeHeight)
        .attr('width', shapeWidth)
        .attr('height', shapeHeight)
        .attr('fill', 'url(#diagonal-stripe-3)')

    // Wrap the subcluster group and arrow in a parent group that's initially hidden
    const subclusterGroup = svg.append('g')
        .attr('id', 'subcluster-parent-group')
        .style('display', 'none'); // Initially hidden

    // Subcluster 
    // Simple curved path with dashes
    const dashedArrow = subclusterGroup.append('g')
        .attr('class', 'dashed-arrow')
        .attr('transform', `translate(${margin.left + glyphWidth}, ${margin.top})`);

    dashedArrow.append('path')
        .attr('d', `M ${triangleWidthMax + 2.05 * shapeWidth}, ${2 * shapeHeight - shapeHeight / 2} 
            C ${glyphWidth * 1}, ${2 * shapeHeight - shapeHeight / 2}
            ${glyphWidth * 1.05}, ${2.2 * shapeHeight - shapeHeight / 2}
            ${glyphWidth * 1.22}, ${2.5 * shapeHeight - shapeHeight / 1.33}`)  // Quadratic curve
        .attr('stroke', 'url(#gradient-gray-black)')
        .attr('stroke-width', 4)
        .attr('stroke-dasharray', '12,6')  // Creates dashed pattern: 12px dash, 6px gap
        .attr('fill', 'none')
        .attr('marker-end', 'url(#arrowhead)');

    const shapesGroup2 = subclusterGroup.append('g')
        .attr('class', 'cluster-group')
        .attr('id', 'subcluster')
        .attr('transform', `translate(${margin.left + glyphWidth * 2.22}, ${margin.top * 2.5})`)

    const lineGroup2 = shapesGroup2.append('g')
        .attr('class', 'connecting-lines');

    lineGroup2.append('path')
        .attr('class', 'connecting-line')
        .attr('d', `
            M 0,${triangleHeightMax}
            V ${triangleHeightMax / 2}
            H 105
        `)
        .on('mouseover', function (d) {
            d3.select(`#dendrogram-link-37-35`)
                .classed('hovered', true);
        })
        .on('mouseout', function (d) {
            d3.select(`#dendrogram-link-37-35`)
                .classed('hovered', false);
        });

    lineGroup2.append('path')
        .attr('class', 'connecting-line')
        .attr('d', `
                M 0,${triangleHeightMax}
                V ${triangleHeightMax + triangleHeightMax / 2}
                H 190
            `)
        .on('mouseover', function (d) {
            d3.select(`#dendrogram-link-37-32`)
                .classed('hovered', true);
        })
        .on('mouseout', function (d) {
            d3.select(`#dendrogram-link-37-32`)
                .classed('hovered', false);
        });

    // Circles
    lineGroup2.append('circle')
        .attr('class', 'dendrogram-node')
        .attr('cx', 105)
        .attr('cy', triangleHeightMax / 2)
    lineGroup2.append('circle')
        .attr('class', 'dendrogram-node')
        .attr('cx', 190)
        .attr('cy', triangleHeightMax + triangleHeightMax / 2)
    lineGroup2.append('circle')
        .attr('class', 'dendrogram-node')
        .attr('cx', 0)
        .attr('cy', triangleHeightMax)

    // Highlight rectangles 3 and 4
    const highlightRect3 = highlightGroup.append('rect')
        .attr('class', 'highlight-rect')
        .attr('id', 'highlight-rect-3')
        .attr('x', 10 * cellSize - cellSize / 2)
        .attr('y', 2 * cellSize)
        .attr('width', 11 * cellSize)
        .attr('height', 10 * cellSize)

    const highlightRect4 = highlightGroup.append('rect')
        .attr('class', 'highlight-rect')
        .attr('id', 'highlight-rect-4')
        .attr('x', 14 * cellSize)
        .attr('y', 12 * cellSize)
        .attr('width', 6 * cellSize + cellSize / 2)
        .attr('height', 8 * cellSize + cellSize / 2)

    // Triangles
    const triangleC3 = shapesGroup2.append('polygon')
        .attr('class', 'glyph glyph-triangle')
        .attr('points', `105,${triangleHeightMax / 2} 
            ${triangleWidthMax},${triangleHeightMax / 2 - 48} 
            ${triangleWidthMax},${triangleHeightMax / 2 + 48}`)
        .on('mouseover', function (d) {
            d3.select(this).raise();
            d3.select('#highlight-rect-3')
                .classed('hovered', true);
        })
        .on('mouseout', function (d) {
            d3.select('#highlight-rect-3')
                .classed('hovered', false);
        });

    const triangleC4 = shapesGroup2.append('polygon')
        .attr('class', 'glyph glyph-triangle glyph-interactive')
        .attr('transform', `translate(0, ${triangleHeightMax})`)
        .attr('points', `190,${triangleHeightMax / 2}
            ${triangleWidthMax},${triangleHeightMax / 2 - 38}
            ${triangleWidthMax},${triangleHeightMax / 2 + 38}`)
        .on('mouseover', function (d) {
            d3.select(this).raise();
            d3.select('#highlight-rect-4')
                .classed('hovered', true);
        })
        .on('mouseout', function (d) {
            d3.select('#highlight-rect-4')
                .classed('hovered', false);
        });

    const squareC4 = shapesGroup2.append('rect')
        .datum(5)
        .attr('class', 'glyph glyph-square glyph-interactive')
        .attr('x', triangleWidthMax)
        .attr('y', 0)
        .attr('width', shapeWidth)
        .attr('height', shapeHeight)
        .attr('fill', d => colorScaleIntra(d))
        .on('mouseover', function (d) {
            d3.select(this).raise();
            const leafIds = root.leaves()
                .filter(leaf => cluster2Ids1.includes(leaf.data.id))
                .map(leaf => `#dendrogram-node-${leaf.data.id}`)
                .join(',');

            d3.selectAll(leafIds)
                .classed('hovered', true);
        })
        .on('mouseout', function (d) {
            const leafIds = root.leaves()
                .filter(leaf => cluster2Ids1.includes(leaf.data.id))
                .map(leaf => `#dendrogram-node-${leaf.data.id}`)
                .join(',');

            d3.selectAll(leafIds)
                .classed('hovered', false);
        });

    const squareC5 = shapesGroup2.append('rect')
        .datum(4.2)
        .attr('class', 'glyph glyph-square glyph-interactive')
        .attr('x', triangleWidthMax + shapeWidth)
        .attr('y', shapeHeight)
        .attr('width', shapeWidth)
        .attr('height', shapeHeight)
        .attr('fill', d => colorScaleIntra(d))
        .on('mouseover', function (d) {
            d3.select(this).raise();
            const leafIds = root.leaves()
                .filter(leaf => cluster2Ids2.includes(leaf.data.id))
                .map(leaf => `#dendrogram-node-${leaf.data.id}`)
                .join(',');
            d3.selectAll(leafIds)
                .classed('hovered', true);
        })
        .on('mouseout', function (d) {
            const leafIds = root.leaves()
                .filter(leaf => cluster2Ids2.includes(leaf.data.id))
                .map(leaf => `#dendrogram-node-${leaf.data.id}`)
                .join(',');
            d3.selectAll(leafIds)
                .classed('hovered', false);
        });

    const squareC6 = shapesGroup2.append('rect')
        .attr('class', 'glyph glyph-square')
        .attr('x', triangleWidthMax)
        .attr('y', shapeHeight)
        .attr('width', shapeWidth)
        .attr('height', shapeHeight)
        .attr('fill', 'url(#diagonal-stripe-3)')

    // Show subcluster when clicking squareC3
    d3.select(triangleC2.node())
        .on('click', function () {
            const group = d3.select('#subcluster-parent-group');
            const currentDisplay = group.style('display');
            if (currentDisplay === 'none' || currentDisplay === '') {
                group.style('display', null);
            } else {
                group.style('display', 'none');
            }
        });
}

init();