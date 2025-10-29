
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


const dendro_width = 150;
const cell_size = 20;
// Color scale for heatmap
const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([0, 1]);

/**
 * Create the complete visualization with dendrogram overlaid on heatmap
 */
function createVisualization(heatmapData, dendroData) {

    const root = d3.hierarchy(dendroData);

    const num_rows_dendro = root.leaves().length;
    const dendro_height = cell_size * num_rows_dendro;

    const cluster = d3.cluster()
        .size([dendro_height, dendro_width])
        .separation(() => 1);

    cluster(root);

    let minRootHeight = d3.max(root.links(), d => d.target.x);

    const rows = [...new Set(heatmapData.map(d => d.row))];
    const cols = [...new Set(heatmapData.map(d => d.col))];

    const cellSize = (minRootHeight + 3) / 20; // Defines the square size of the heatmap
    const margin = { top: 50, right: 250, bottom: 50, left: 100 }; // Adjusted margin for dendrogram alignment
    const width = cols.length * cellSize + margin.left + margin.right;
    const height = rows.length * cellSize + margin.top + margin.bottom;

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(root.descendants(), d => d.x)]) // Scale tree's height
        .range([margin.top, height - margin.bottom]); // Map to heatmap's height

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(root.descendants(), d => d.y)]) // Depth of dendrogram
        .range([margin.left, width - margin.right]); // Align with heatmap width

    const minScore = d3.min(heatmapData, d => d.score);
    const maxScore = d3.max(heatmapData, d => d.score);

    const heatmap_colorscale = d3.scaleSequential(d3.interpolateBlues)
        .domain([maxScore, minScore]);

    let svg_combined = d3.select("#combinedSvg")
        .attr("width", width)
        .attr("height", height);


    // Clear any existing content
    svg_combined.selectAll("*").remove();

    // Create heatmap group
    const heatmapG = svg_combined.append("g")
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
    const dendroG = svg_combined.append("g");

    // Draw dendrogram links
    dendroG.selectAll(".dendro-link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "dendrogram-link")
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
        .attr("cx", d => xScale(d.y))
        .attr("cy", d => yScale(d.x))
        .attr("r", 3);

    // Add color legend (horizontal)
    const legendWidth = 20;  // Swapped: now this is the thickness
    const legendHeight = 250; // Swapped: now this is the length
    const legendX = 18; // Position to the right of heatmap
    const legendY = margin.top; // Align with top of heatmap

    const defs = svg_combined.append('defs');
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
    svg_combined.append('rect')
        .attr('x', legendX)
        .attr('y', legendY)
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#legend-gradient)');

    // Label above the legend (0)
    svg_combined.append('text')
        .attr('x', legendX + legendWidth / 2)  // Center horizontally
        .attr('y', legendY - 5)  // Position above rectangle
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'baseline')
        .attr('class', 'dendrogram-text')
        .style('font-size', '9px')
        .text('0');

    // Label below the legend (1)
    svg_combined.append('text')
        .attr('x', legendX + legendWidth / 2)  // Center horizontally
        .attr('y', legendY + legendHeight + 12)  // Position below rectangle
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'hanging')
        .attr('class', 'dendrogram-text')
        .style('font-size', '9px')
        .text('1');

    // Vertical text "Similarity" beside the legend
    // svg_combined.append('text')
    //     .attr('x', legendX)  // Position to the left of legend
    //     .attr('y', legendY + legendHeight / 2)  // Center vertically
    //     .attr('text-anchor', 'middle')
    //     .attr('dominant-baseline', 'middle')
    //     .attr('class', 'dendrogram-text')
    //     .attr('transform', `rotate(-90, ${legendX - 10}, ${legendY + legendHeight / 2})`)  // Rotate 90° counter-clockwise
    //     .style('font-size', '12px')
    //     .text('Similarity');
}

init();