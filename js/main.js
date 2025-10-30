// Configuration
const boxWidth = 220;
const boxHeight = 120;
const boxSpacing = 80;
const cornerRadius = 20;
const loopHeight = 20; // Height of the feedback loop arcs

// Slide 9: Workflow
function createWorkflowDiagram() {
    const svg = d3.select('#workflowSvg');

    // Clear any existing content
    svg.selectAll('*').remove();

    const steps = [
        'Individual\nsequences',
        'Clusters,\ndendrogram',
        'Cluster\ndescriptions',
        'Merge/split\nclusters',
        'Identify\nstrategies'
    ];

    const totalWidth = (boxWidth * steps.length) + (boxSpacing * (steps.length - 1)) + 100;
    const totalHeight = boxHeight * 2;

    // Set SVG dimensions
    svg.attr('width', totalWidth)
        .attr('height', totalHeight);

    // Create a group for centering
    const g = svg.append('g')
        .attr('transform', `translate(5, ${totalHeight / 2 - boxHeight / 2})`);

    // Define arrow marker
    const defs = svg.append('defs');
    defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('markerWidth', 10)
        .attr('markerHeight', 10)
        .attr('refX', 9)
        .attr('refY', 3)
        .attr('orient', 'auto')
        .append('polygon')
        .attr('points', '3 0, 10 3, 3 6')
        .attr('fill', '#333');

    // Create boxes and arrows
    steps.forEach((text, i) => {
        const x = i * (boxWidth + boxSpacing);

        // Create box group
        const boxGroup = g.append('g')
            .attr('class', 'box workflow-box-group')
            .attr('transform', `translate(${x}, 0)`);

        // Draw rounded rectangle
        boxGroup.append('rect')
            .attr('width', boxWidth)
            .attr('height', boxHeight)
            .attr('rx', cornerRadius)
            .attr('ry', cornerRadius)

        // Add text (handle line breaks)
        const lines = text.split('\n');
        const textGroup = boxGroup.append('text')
            .attr('x', boxWidth / 2)
            .attr('y', boxHeight / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('class', 'boxword');

        if (lines.length === 1) {
            textGroup.text(lines[0]);
        } else {
            // Multiple lines - adjust positioning
            lines.forEach((line, lineIndex) => {
                textGroup.append('tspan')
                    .attr('x', boxWidth / 2)
                    .attr('dy', lineIndex === 0 ? `-${(lines.length - 1) * 0.5}em` : '1.2em')
                    .text(line);
            });
        }

        // Draw arrow to next box (except for last box)
        if (i < steps.length - 1) {
            const line = g.append('line')
                .attr('x1', x + boxWidth)
                .attr('y1', boxHeight / 2)
                .attr('x2', x + boxWidth + boxSpacing)
                .attr('y2', boxHeight / 2)
                .attr('stroke', '#333')
                .attr('stroke-width', 3)
                .attr('stroke-dasharray', '15,5')
                .attr('stroke-dashoffset', 0)
                .attr('marker-end', 'url(#arrowhead)');

            // Animate the dash from left to right
            const lineLength = boxSpacing;
            line
                .attr('stroke-dashoffset', lineLength)
                .transition()
                .duration(10000)
                .ease(d3.easeLinear)
                .attr('stroke-dashoffset', 0)
                .on('end', function repeat() {
                    d3.select(this)
                        .attr('stroke-dashoffset', lineLength)
                        .transition()
                        .duration(10000)
                        .ease(d3.easeLinear)
                        .attr('stroke-dashoffset', 0)
                        .on('end', repeat);
                });
        }
    });
}

createWorkflowDiagram();


// Slide 10: Pipeline
function createPipelineDiagram() {
    const svg = d3.select('#pipelineSvg');

    // Clear any existing content
    svg.selectAll('*').remove();

    const boxes = [
        { text: 'Algorithmic\nComponents', color: '#f4d47a', stroke: '#000', dashed: true },
        { text: 'Split/Merge/\nExpand\nClusters', color: '#99CCFF', stroke: '#000', dashed: false },
        { text: 'Compare/\nConform/Merge\nProcess Models', color: '#99CCFF', stroke: '#000', dashed: false },
        { text: 'Investigate\nIndividual\nSequences', color: '#99CCFF', stroke: '#000', dashed: false },
        { text: 'Identify\nExploration\nStrategies', color: '#f4d47a', stroke: '#000', dashed: false }
    ];

    const totalWidth = (boxWidth * boxes.length) + (boxSpacing * (boxes.length - 1)) + 180;
    const totalHeight = boxHeight * 3.5 + loopHeight;

    // Set SVG dimensions
    svg.attr('width', totalWidth)
        .attr('height', totalHeight);

    // Create a group for centering
    const g = svg.append('g')
        .attr('transform', `translate(5, ${(totalHeight / 2) - (boxHeight / 2)})`);

    // Define arrow marker
    const defs = svg.append('defs');
    defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('markerWidth', 10)
        .attr('markerHeight', 10)
        .attr('refX', 9)
        .attr('refY', 3)
        .attr('orient', 'auto')
        .append('polygon')
        .attr('points', '3 0, 10 3, 3 6')
        .attr('fill', '#333');

    // Draw boxes and forward arrows
    boxes.forEach((box, i) => {
        const x = i * (boxWidth + boxSpacing);

        // Create box group
        const boxGroup = g.append('g')
            .attr('class', 'box pipeline-box-group')
            .attr('transform', `translate(${x}, 0)`);

        // Draw rounded rectangle
        const rect = boxGroup.append('rect')
            .attr('class', 'pipeline-box')
            .attr('id', `pipeline-box-${i}`)
            .attr('width', boxWidth)
            .attr('height', boxHeight)
            .attr('rx', cornerRadius)
            .attr('ry', cornerRadius)
            .attr('fill', box.color)
            .attr('stroke', box.stroke)
            .attr('stroke-width', 3);

        // Add dashed stroke if needed
        if (box.dashed) {
            rect.attr('stroke-dasharray', "15, 5");
        }

        // Add text (handle line breaks)
        const lines = box.text.split('\n');
        const textGroup = boxGroup.append('text')
            .attr('x', boxWidth / 2)
            .attr('y', boxHeight / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('class', 'boxword');

        // Add each line
        const lineHeight = 1.2;
        const totalLines = lines.length;

        lines.forEach((line, lineIndex) => {
            const yOffset = (lineIndex - (totalLines - 1) / 2) * lineHeight;
            textGroup.append('tspan')
                .attr('x', boxWidth / 2)
                .attr('dy', lineIndex === 0 ? `${yOffset}em` : `${lineHeight}em`)
                .text(line);
        });

        // First box: click to toggle "DTW" label via CSS class
        if (i === 0) {
            // To get line breaks in SVG <text>, you must use multiple <tspan> elements – SVG doesn't recognize '\n' for newlines.
            const pipelineDetailLines = [
                "Data Preprocessing",
                "Tailored DTW Computation",
                "Hierarchical Clustering",
                "Process Mining",
                "Model Conformance"
            ];
            const dtwText = boxGroup.append('text')
                .attr('x', boxWidth / 2)
                .attr('y', boxHeight + 28)
                .attr('text-anchor', 'middle')
                .attr('class', 'pipeline-detail');

            pipelineDetailLines.forEach((line, i) => {
                dtwText.append('tspan')
                    .attr('x', boxWidth / 2)
                    .attr('dy', i === 0 ? "0em" : "1.3em")
                    .text(line);
            });

            let dtwVisible = false;

            boxGroup.on('click', function () {
                dtwVisible = !dtwVisible;
                dtwText.classed('is-visible', dtwVisible);
            });
        }
        else if (i === 1) {
            const exampleSvg = document.getElementById('clusterDemoSvg');
            let visible = false;

            // Ensure exampleSvg has initial state for animation
            if (exampleSvg) {
                exampleSvg.style.transition = 'transform 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.5s cubic-bezier(0.4,0,0.2,1)';
                exampleSvg.style.transform = 'translateY(30px)';
                exampleSvg.style.opacity = '0';
                exampleSvg.style.display = 'none';
            }

            boxGroup.on('click', function () {
                visible = !visible;
                if (exampleSvg) {
                    if (visible) {
                        exampleSvg.style.display = 'block';
                        setTimeout(() => {
                            exampleSvg.style.transform = 'translateY(0)';
                            exampleSvg.style.opacity = '1';
                        }, 10); // allow reflow for animation
                    } else {
                        exampleSvg.style.transform = 'translateY(30px)';
                        exampleSvg.style.opacity = '0';
                        // Wait for transition before hiding
                        setTimeout(() => {
                            if (!visible) { // in case of rapid clicks
                                exampleSvg.style.display = 'none';
                            }
                        }, 500);
                    }
                }
            });
        }
        else if (i === 2) {
            const exampleSvg = document.getElementById('processModelDemoSvg');
            let visible = false;
            if (exampleSvg) {
                exampleSvg.style.transition = 'transform 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.5s cubic-bezier(0.4,0,0.2,1)';
                exampleSvg.style.transform = 'translateY(30px)';
                exampleSvg.style.opacity = '0';
                exampleSvg.style.display = 'none';
            }

            boxGroup.on('click', function () {
                visible = !visible;
                if (exampleSvg) {
                    if (visible) {
                        exampleSvg.style.display = 'block';
                        setTimeout(() => {
                            exampleSvg.style.transform = 'translateY(0)';
                            exampleSvg.style.opacity = '1';
                        }, 10); // allow reflow for animation
                    } else {
                        exampleSvg.style.transform = 'translateY(30px)';
                        exampleSvg.style.opacity = '0';
                        // Wait for transition before hiding
                        setTimeout(() => {
                            if (!visible) { // in case of rapid clicks
                                exampleSvg.style.display = 'none';
                            }
                        }, 500);
                    }
                }
            });
        }

        // Draw forward arrow to next box (except for last box)
        if (i < boxes.length - 1) {
            g.append('line')
                .attr('x1', x + boxWidth)
                .attr('y1', boxHeight / 2)
                .attr('x2', x + boxWidth + boxSpacing)
                .attr('y2', boxHeight / 2)
                .attr('stroke', '#333')
                .attr('stroke-width', 3)
                .attr('marker-end', 'url(#arrowhead)');
        }
    });

}

createPipelineDiagram();




// Slide 2: Color changing circles
document.querySelectorAll('#colorSvg .interactive-circle').forEach(circle => {
    let colorIndex = 0;
    circle.addEventListener('click', function () {
        const colors = JSON.parse(this.getAttribute('data-colors'));
        colorIndex = (colorIndex + 1) % colors.length;
        this.style.fill = colors[colorIndex];
    });
});

// Slide 3: Drag and drop
let selectedElement = null;
let offset = { x: 0, y: 0 };

const dragSvg = document.getElementById('dragSvg');

document.querySelectorAll('.draggable').forEach(element => {
    element.addEventListener('mousedown', startDrag);
});

function startDrag(e) {
    selectedElement = e.target;

    const svg = selectedElement.ownerSVGElement;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

    if (selectedElement.tagName === 'rect') {
        offset.x = svgP.x - parseFloat(selectedElement.getAttribute('x'));
        offset.y = svgP.y - parseFloat(selectedElement.getAttribute('y'));
    } else if (selectedElement.tagName === 'circle') {
        offset.x = svgP.x - parseFloat(selectedElement.getAttribute('cx'));
        offset.y = svgP.y - parseFloat(selectedElement.getAttribute('cy'));
    } else if (selectedElement.tagName === 'polygon') {
        const bbox = selectedElement.getBBox();
        offset.x = svgP.x - (bbox.x + bbox.width / 2);
        offset.y = svgP.y - (bbox.y + bbox.height / 2);
    } else if (selectedElement.tagName === 'ellipse') {
        offset.x = svgP.x - parseFloat(selectedElement.getAttribute('cx'));
        offset.y = svgP.y - parseFloat(selectedElement.getAttribute('cy'));
    }

    dragSvg.addEventListener('mousemove', drag);
    dragSvg.addEventListener('mouseup', endDrag);
}

function drag(e) {
    if (selectedElement) {
        e.preventDefault();

        const svg = selectedElement.ownerSVGElement;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        if (selectedElement.tagName === 'rect') {
            selectedElement.setAttribute('x', svgP.x - offset.x);
            selectedElement.setAttribute('y', svgP.y - offset.y);
        } else if (selectedElement.tagName === 'circle') {
            selectedElement.setAttribute('cx', svgP.x - offset.x);
            selectedElement.setAttribute('cy', svgP.y - offset.y);
        } else if (selectedElement.tagName === 'polygon') {
            const bbox = selectedElement.getBBox();
            const centerX = bbox.x + bbox.width / 2;
            const centerY = bbox.y + bbox.height / 2;
            const dx = (svgP.x - offset.x) - centerX;
            const dy = (svgP.y - offset.y) - centerY;

            const points = selectedElement.getAttribute('points').split(' ');
            const newPoints = points.map(point => {
                const [x, y] = point.split(',').map(Number);
                return `${x + dx},${y + dy}`;
            }).join(' ');
            selectedElement.setAttribute('points', newPoints);
        } else if (selectedElement.tagName === 'ellipse') {
            selectedElement.setAttribute('cx', svgP.x - offset.x);
            selectedElement.setAttribute('cy', svgP.y - offset.y);
        }
    }
}

function endDrag() {
    selectedElement = null;
    dragSvg.removeEventListener('mousemove', drag);
    dragSvg.removeEventListener('mouseup', endDrag);
}

// Slide 4: Interactive bar chart
document.querySelectorAll('#chartSvg .bar').forEach(bar => {
    bar.addEventListener('click', function () {
        const newHeight = Math.random() * 150 + 50;
        const newY = 300 - newHeight;
        this.setAttribute('height', newHeight);
        this.setAttribute('y', newY);
    });
});