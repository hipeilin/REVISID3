const taskColors = ["#000000", "#7fc97f", "#beaed4", "#fdc086", "#adad2a", "#386cb0"];
// green 7fc97f - task 1
// purple beaed4 - task 2
// orange fdc086 - task 3
// yellow adad2a - task 4
// blue 386cb0 - task 5

const taskColorScale = d3.scaleOrdinal()
    .domain([0, 1, 2, 3, 4, 5])
    .range(taskColors);

// Parameters for square rendering
const squareSize = 12;
const squareMargin = 2;
const squaresPerRow = 21;

// Configuration
const width = 1000;
const height = 500;
const nodeRadius = 12;
const arcTopMargin = 120;

// Helper for centering
function getMinMaxX(nodes) {
    return nodes.reduce(
        (acc, n) => {
            if (n.x < acc.min) acc.min = n.x;
            if (n.x > acc.max) acc.max = n.x;
            return acc;
        },
        { min: Infinity, max: -Infinity }
    );
}

function createProcessModelDemo() {
    const svg = d3.select('#processModelDemoSvg');

    // Clear any existing content
    svg.selectAll('*').remove();

    // Set SVG dimensions
    svg.attr('width', width)
        .attr('height', height);

    // Define nodes
    const nodes = [
        { id: 'start', label: '▶', x: 40, color: '#000' },
        { id: 1, label: '', x: 80, color: '#17542e' },
        { id: 2, label: '', x: 120, color: '#a0b0a7' },
        { id: 3, label: '', x: 160, color: '#c5b894' },
        { id: 4, label: '', x: 200, color: '#C59C94' },
        { id: 'end', label: '⏹', x: 240, color: '#000' }
    ];

    // Compute content width for centering
    const { min, max } = getMinMaxX(nodes);
    const contentWidth = max - min;
    const horizontalCenterOffset = (width / 2) - (contentWidth / 2) - min;

    // Create a group and center its contents in the SVG
    const g = svg.append('g')
        .attr('transform', `translate(${horizontalCenterOffset}, ${arcTopMargin})`);

    // Define arcs with different heights
    // Added 'thickness' property to each arc
    const arcs = [
        { from: 'start', to: 1, height: -60, thickness: 4 },
        { from: 1, to: 'end', height: -200, thickness: 3 },
        { from: 1, to: 3, height: -100, thickness: 1 },
        { from: 3, to: 'end', height: -100, thickness: 1 }
    ];

    // Define arrow markers
    const defs = svg.append('defs');

    defs.append('marker')
        .attr('id', 'arrow-gray')
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('refX', 7)
        .attr('refY', 3)
        .attr('orient', 'auto')
        .attr('fill', '#999');

    defs.append('marker')
        .attr('id', 'arrow-light')
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('refX', 7)
        .attr('refY', 3)
        .attr('orient', 'auto')
        .attr('fill', '#ccc');

    // Draw arcs
    arcs.forEach(arc => {
        const fromNode = nodes.find(n => n.id === arc.from);
        const toNode = nodes.find(n => n.id === arc.to);

        const x1 = fromNode.x;
        const x2 = toNode.x;
        const midX = (x1 + x2) / 2;

        const path = `M ${x1},0 Q ${midX},${arc.height} ${x2},0`;

        g.append('path')
            .attr('class', 'process-arc')
            .attr('d', path)
            .attr('fill', 'none')
            .attr('stroke', '#2b2b2b')
            .attr('stroke-width', arc.thickness)
            .attr('marker-end', arc.color === '#999' ? 'url(#arrow-gray)' : 'url(#arrow-light)')
            .attr('opacity', 0.5)
            .on('mouseover', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 1)
                    .attr('stroke-width', arc.thickness + 1);
            })
            .on('mouseout', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 0.5)
                    .attr('stroke-width', arc.thickness);
            });
    });

    // Draw nodes
    nodes.forEach((node, i) => {
        const nodeGroup = g.append('g')
            .attr('class', 'process-node')
            .attr('transform', `translate(${node.x}, 0)`);

        // Circle
        nodeGroup.append('circle')
            .attr('class', 'process-node-circle')
            .attr('r', nodeRadius)
            .attr('fill', node.color)
            .attr('opacity', 1)
            .on('mouseover', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', nodeRadius + 2)
            })
            .on('mouseout', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', nodeRadius)
            });

        // If it is the second node, add a stroke
        if (i === 1) {
            nodeGroup.insert('circle', ':first-child')
                .attr('r', nodeRadius + 2)
                .attr('fill', 'none')
                .attr('stroke', '#2b2b2b')
                .attr('stroke-width', 6)
                .attr('stroke-opacity', 0.25);
        }

        if (node.id === "start") {
            nodeGroup.append('path')
                .attr('d', d3.symbol().type(d3.symbolTriangle).size(50))
                .attr('transform', `translate(0, 0) rotate(90)`)
                .attr('fill', '#fff')
                .attr('pointer-events', 'none');
        }
        if (node.id === "end") {
            nodeGroup.append('path')
                .attr('d', d3.symbol().type(d3.symbolSquare).size(70))
                .attr('transform', `translate(0, 0)`)
                .attr('fill', '#fff')
                .attr('pointer-events', 'none');
        }
    });

    // Create sequence matrix below (center horizontally as well)
    // Each row is squaresPerRow. Find out matrix width
    const matrixCols = squaresPerRow;
    const matrixRows = Math.ceil(85 / matrixCols); // 85 = total squares (see sequenceData below)
    const matrixWidth = matrixCols * squareSize + (matrixCols - 1) * squareMargin;

    // matrixCenterOffset ensures sequence aligned with process model
    const nodeContentCenter = (min + max) / 2;
    const matrixLeft = nodeContentCenter - (matrixWidth / 2);

    const matrixGroup = g.append('g')
        .attr('transform', `translate(${matrixLeft}, 30)`);

    // Define sequence data
    const sequenceData = [
        ...Array(2).fill(5),
        ...Array(33).fill(0),
        ...Array(5).fill(1),
        ...Array(1).fill(5),
        ...Array(15).fill(1),
        ...Array(1).fill(3),
        ...Array(27).fill(0)
    ];

    // Draw squares for each digit in sequence
    matrixGroup.selectAll('rect')
        .data(sequenceData)
        .enter()
        .append('rect')
        .attr('class', 'process-sequence-square')
        .attr('x', (d, i) => (i % squaresPerRow) * (squareSize + squareMargin))
        .attr('y', (d, i) => Math.floor(i / squaresPerRow) * (squareSize + squareMargin))
        .attr('width', squareSize)
        .attr('height', squareSize)
        .attr('fill', d => taskColorScale(d))
        .attr('rx', 4)
        .attr('ry', 4)
        .on('mouseover', function () {
            d3.select(this)
                .attr('fill', '#fff');
        })
        .on('mouseout', function () {
            d3.select(this)
                .transition()
                .duration(600)
                .attr('fill', d => taskColorScale(d));
        });

    // Add Cluster ID label to the left of the arc diagram
    // Find leftmost position of the arc diagram (min)
    // Place label ~60px left of 'min' and vertically centered with node y-coordinate (assume y=0)
    const labelX = min - 100; // 60px to the left
    const labelY = 0;

    const clusterLabelGroup = g.append('g')
        .attr('transform', `translate(${labelX}, ${labelY})`);

    // Main label: "Cluster ID" (larger font, bold)
    clusterLabelGroup.append('text')
        .attr('class', 'process-cluster-label')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'hanging')
        .attr('font-size', 24)
        .attr('font-weight', 'bold')
        .attr('fill', '#000')
        .text('Cluster ID');

    // Sub-label: "388" (smaller font, just below)
    clusterLabelGroup.append('text')
        .attr('class', 'process-cluster-label')
        .attr('x', 0)
        .attr('y', 34) // ~28px from above, with some spacing
        .attr('text-anchor', 'end')
        .attr('font-size', 18)
        .attr('font-weight', 'normal')
        .attr('fill', '#000')
        .text('388');

    // Add Cluster Size label to the right of the arc diagram
    // Find rightmost position of the arc diagram (max)
    // Place label ~60px right of 'max' and vertically centered with node y-coordinate (assume y=0)
    const rightLabelX = max + 100; // 60px to the right
    const rightLabelY = 0;

    const clusterSizeLabelGroup = g.append('g')
        .attr('transform', `translate(${rightLabelX}, ${rightLabelY})`);

    // Main label: "Cluster Size" (bigger font, bold)
    clusterSizeLabelGroup.append('text')
        .attr('class', 'process-cluster-label')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'start')
        .attr('dominant-baseline', 'hanging')
        .attr('font-size', 24)
        .attr('font-weight', 'bold')
        .attr('fill', '#000')
        .text('Cluster Size');

    // Sub-label: "84" (smaller font, just below)
    clusterSizeLabelGroup.append('text')
        .attr('class', 'process-cluster-label')
        .attr('x', 0)
        .attr('y', 38) // ~32px below previous, with some spacing
        .attr('text-anchor', 'start')
        .attr('font-size', 18)
        .attr('font-weight', 'normal')
        .attr('fill', '#000')
        .text('84');

    // Create legend
    const legendItems = [
        { color: '#000000', label: 'Start/End' },
        { color: '#17542e', label: 'New InfoPanel' },
        { color: '#a0b0a7', label: 'Revisit InfoPanel' },
        { color: '#c5b894', label: 'Year Change' },
        { color: '#C59C94', label: 'Gender Change' }
    ];

    // Calculate legend position - center it horizontally, place below sequence matrix
    const legendCircleRadius = 8;
    const legendSpacing = 4; // spacing between circle and label
    const legendItemSpacing = 20; // spacing between legend items
    const legendTotalWidth = legendItems.length * legendItemSpacing - legendItemSpacing;
    const legendStartX = nodeContentCenter - (legendTotalWidth / 2);
    const legendY = 80 + matrixRows * (squareSize + squareMargin); // below sequence matrix with some margin

    const legendGroup = g.append('g')
        .attr('transform', `translate(${legendStartX}, ${legendY})`);

    legendItems.forEach((item, i) => {
        const itemGroup = legendGroup.append('g')
            .attr('transform', `translate(0, ${i * legendItemSpacing})`);

        // Circle
        itemGroup.append('circle')
            .attr('r', legendCircleRadius)
            .attr('fill', item.color)
            .attr('cx', 0)
            .attr('cy', 0);

        // Label
        itemGroup.append('text')
            .attr('class', 'process-legend-label')
            .attr('x', legendCircleRadius + legendSpacing)
            .attr('y', 0)
            .attr('dominant-baseline', 'middle')
            .attr('font-size', 14)
            .attr('fill', '#000')
            .text(item.label);
    });

    // add title on top of arc diagram
    const titleGroup = svg.append('g')
        .attr('transform', `translate(${horizontalCenterOffset}, ${legendY +  matrixRows * (squareSize + squareMargin) + 10})`);
    titleGroup.append('text')
        .attr('class', 'process-title')
        .attr('x', 0)
        .attr('y', 0)
        .html('Open InfoPanel &rarr; End Exploration Behavior');


}

createProcessModelDemo();