// Global variables
const dendroWidth = 150;
const cellSize = 20;
const glyphWidth = 500;

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
    const width = cols.length * cellSize + margin.left + margin.right + glyphWidth;
    const height = rows.length * cellSize + margin.top + margin.bottom;

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(root.descendants(), d => d.x)]) // Scale tree's height
        .range([margin.top, height - margin.bottom]); // Map to heatmap's height

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(root.descendants(), d => d.y)]) // Depth of dendrogram
        .range([margin.left, width - margin.right - glyphWidth]); // Align with heatmap width

    const minScore = d3.min(heatmapData, d => d.score);
    const maxScore = d3.max(heatmapData, d => d.score);

    const heatmap_colorscale = d3.scaleSequential(d3.interpolateBlues)
        .domain([maxScore, minScore]);

    let svg = d3.select("#example")
        .attr("width", width)
        .attr("height", height);

    // Clear any existing content
    svg.selectAll("*").remove();

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
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5);

    dendroG.selectAll("circle")
        .data(root.descendants())
        .enter()
        .append("circle")
        .attr("class", "dendrogram-node")
        .attr("id", d => `dendrogram-node-${d.data.id}`)
        .attr("cx", d => xScale(d.y))
        .attr("cy", d => yScale(d.x))
        .attr("r", 3);

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
        .attr('x', legendX + legendWidth + 25)
        .attr('y', legendHeight / 2)
        .attr('transform', `rotate(-90,${legendX + legendWidth + 25},${legendY + legendHeight / 2})`)
        .text('DTW Score')
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .attr('fill', 'black');

    // Create cluster shapes
    const shapeWidth = 100;
    const shapeHeight = 100;
    const triangleWidthMax = 300;
    const triangleHeightMax = 100;

    // Create a group for all shapes
    const shapesGroup = svg.append('g')
        .attr('class', 'cluster-group')
        .attr('transform', `translate(${margin.left + glyphWidth}, ${margin.top})`)

    // Add connecting lines BEFORE triangles (so triangles appear on top)
    const lineGroup = shapesGroup.append('g')
        .attr('class', 'connecting-lines');

    // Line from middle of the dendrogram to the first triangle
    lineGroup.append('path')
        .attr('class', 'connecting-line')
        .attr('d', `
            M 0,${triangleHeightMax}
            V ${triangleHeightMax / 2}
            H 98
        `)
        .attr('stroke', 'black')
        .attr('stroke-width', 2)
        .attr('fill', 'none')
        .on('mouseover', function (d) {
            d3.select(`#dendrogram-link-38-36`)
                .attr('stroke', 'red')
                .attr('stroke-width', 4)
        })
        .on('mouseout', function (d) {
            d3.select(`#dendrogram-link-38-36`)
                .attr('stroke', 'black')
                .attr('stroke-width', 1.5)
        });
    // Line from middle of the dendrogram to the second triangle
    lineGroup.append('path')
        .attr('d', `
            M 0,${triangleHeightMax}
            V ${triangleHeightMax + triangleHeightMax / 2}
            H 100
        `)
        .attr('stroke', 'black')
        .attr('stroke-width', 2)
        .attr('fill', 'none')
        .on('mouseover', function (d) {
            d3.select(`#dendrogram-link-38-37`)
                .attr('stroke', 'red')
                .attr('stroke-width', 4)
        })
        .on('mouseout', function (d) {
            d3.select(`#dendrogram-link-38-37`)
                .attr('stroke', 'black')
                .attr('stroke-width', 1.5)
        });
    // Append circles at the midpoints
    lineGroup.append('circle')
        .attr('cx', 98)
        .attr('cy', triangleHeightMax / 2)
        .attr('r', 3)
        .attr('fill', 'black');
    lineGroup.append('circle')
        .attr('cx', 100)
        .attr('cy', triangleHeightMax + triangleHeightMax / 2)
        .attr('r', 3)
        .attr('fill', 'black');
    lineGroup.append('circle')
        .attr('cx', 0)
        .attr('cy', triangleHeightMax)
        .attr('r', 3)
        .attr('fill', 'black');

    // Highlight rectangles
    const highlightGroup = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)

    const highlightRect1 = highlightGroup.append('rect')
        .attr('class', 'highlight-rect')
        .attr('id', 'highlight-rect-1')
        .attr('x', 6 * cellSize - cellSize / 2)
        .attr('y', -cellSize / 2)
        .attr('width', 15 * cellSize)
        .attr('height', 3 * cellSize - cellSize / 2)
        .attr('fill', 'rgba(255, 255, 255, 0)')

    const highlightRect2 = highlightGroup.append('rect')
        .attr('class', 'highlight-rect')
        .attr('id', 'highlight-rect-2')
        .attr('x', 6 * cellSize - cellSize / 2)
        .attr('y', 2 * cellSize)
        .attr('width', 15 * cellSize)
        .attr('height', 18 * cellSize + cellSize / 2)
        .attr('fill', 'rgba(255, 255, 255, 0)')

    // Gray triangle (pointing right)
    const triangleC1 = shapesGroup.append('polygon')
        .attr('class', 'glyph glyph-triangle glyph-interactive')
        .attr('points', `98,${triangleHeightMax / 2} ${triangleWidthMax},${triangleHeightMax / 2 - 7} ${triangleWidthMax},${triangleHeightMax / 2 + 7}`)
        .on('mouseover', function (d) {
            d3.select(this).raise();
            d3.select('#highlight-rect-1')
                .attr('fill', 'rgba(255, 255, 255, 0.5)')
                .attr('stroke-width', 4)
                .attr('stroke', 'red')
                .attr('stroke-dasharray', '8 6');
        })
        .on('mouseout', function (d) {
            d3.select('#highlight-rect-1')
                .attr('fill', 'rgba(255, 255, 255, 0)')
                .attr('stroke-width', 0)
        });

    const triangleC2 = shapesGroup.append('polygon')
        .attr('class', 'glyph glyph-triangle glyph-interactive')
        .attr('transform', `translate(0, ${triangleHeightMax})`)
        .attr('points', `100,${triangleHeightMax / 2} ${triangleWidthMax},${triangleHeightMax / 2 - 48} ${triangleWidthMax},${triangleHeightMax / 2 + 48}`)
        .on('mouseover', function (d) {
            d3.select(this).raise();
            d3.select('#highlight-rect-2')
                .attr('fill', 'rgba(255, 255, 255, 0.5)')
                .attr('stroke-width', 4)
                .attr('stroke', 'red')
                .attr('stroke-dasharray', '8 6');
        })
        .on('mouseout', function (d) {
            d3.select('#highlight-rect-2')
                .attr('fill', 'rgba(255, 255, 255, 0)')
                .attr('stroke-width', 0)
        });

    // Create a color scale for conciseness, min value is 0.38 and max value is 7.7
    const colorScaleIntra = d3.scaleSequential(d3.interpolateOranges)
        .domain([0.38, 7.66]);

    const squareC1 = shapesGroup.append('rect')
        .attr('class', 'glyph glyph-square glyph-interactive')
        .datum(0.38)
        .attr('x', triangleWidthMax)
        .attr('y', 0)
        .attr('width', shapeWidth)
        .attr('height', shapeHeight)
        .attr('fill', d => colorScaleIntra(d))
        // .attr('stroke', 'black')
        // .attr('stroke-width', 2)
        .on('mouseover', function (d) {
            d3.select(this).raise();
            const leafIds = root.leaves()
                .filter(leaf => leaf.data.id == 19 || leaf.data.id == 17)
                .map(leaf => `#dendrogram-node-${leaf.data.id}`)
                .join(',');

            d3.selectAll(leafIds)
                .attr('fill', 'white')
                .attr('r', 6)
                .attr('stroke', 'red')
                .attr('stroke-width', 2);
        })
        .on('mouseout', function (d) {
            const leafIds = root.leaves()
                .filter(leaf => leaf.data.id == 19 || leaf.data.id == 17)
                .map(leaf => `#dendrogram-node-${leaf.data.id}`)
                .join(',');

            d3.selectAll(leafIds)
                .attr('fill', 'black')
                .attr('r', 3)
                .attr('stroke-width', 0);
        });

    const squareC2 = shapesGroup.append('rect')
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
                .filter(leaf => leaf.data.id !== 19 && leaf.data.id !== 17)
                .map(leaf => `#dendrogram-node-${leaf.data.id}`)
                .join(',');

            d3.selectAll(leafIds)
                .attr('fill', 'white')
                .attr('r', 6)
                .attr('stroke', 'red')
                .attr('stroke-width', 2);
        })
        .on('mouseout', function (d) {
            const leafIds = root.leaves()
                .filter(leaf => leaf.data.id !== 19 && leaf.data.id !== 17)
                .map(leaf => `#dendrogram-node-${leaf.data.id}`)
                .join(',');

            d3.selectAll(leafIds)
                .attr('fill', 'black')
                .attr('r', 3)
                .attr('stroke-width', 0);
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

    const squareC3 = shapesGroup.append('rect')
        .attr('class', 'glyph glyph-square')
        .attr('x', triangleWidthMax)
        .attr('y', shapeHeight)
        .attr('width', shapeWidth)
        .attr('height', shapeHeight)
        .attr('fill', 'url(#diagonal-stripe-3)')
}



init();