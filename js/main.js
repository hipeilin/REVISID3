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

    // Define arrow markers
    const defs = svg.append('defs');
    // End arrow marker
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
    // Start arrow marker
    defs.append('marker')
        .attr('id', 'arrowhead-start')
        .attr('markerWidth', 10)
        .attr('markerHeight', 10)
        .attr('refX', 1)
        .attr('refY', 3)
        .attr('orient', 'auto')
        .append('polygon')
        .attr('points', '7 0, 0 3, 7 6')
        .attr('fill', '#333');

    // Store all hidden arrows to show/hide them together
    const hiddenArrows = [];

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

        // First box: click to toggle label via CSS class
        if (i === 0) {
            const pipelineDetailLines = [
                "Data Preprocessing",
                "Tailored DTW Computation",
                "Hierarchical Clustering",
                "Process Mining",
                "Model Conformance"
            ];
            const pipelineDetailText = boxGroup.append('text')
                .attr('x', boxWidth / 2)
                .attr('y', boxHeight + 55)
                .attr('text-anchor', 'middle')
                .attr('class', 'pipeline-detail');

            pipelineDetailLines.forEach((line, i) => {
                pipelineDetailText.append('tspan')
                    .attr('x', boxWidth / 2)
                    .attr('dy', i === 0 ? "0em" : "1.3em")
                    .text(line);
            });

            let dtwVisible = false;
            boxGroup.on('click', function () {
                dtwVisible = !dtwVisible;
                pipelineDetailText.classed('is-visible', dtwVisible);
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
        // Last box: click to toggle label via CSS class
        else if (i === 4) {
            const pipelineDetailLines = [
                "\"Basic retrieval\"",
                "\"Cascading\"",
                "\"Nested-Loop\"",
                "\"Mixed Approach\""
            ];

            const pipelineDetailText = boxGroup.append('text')
                .attr('x', boxWidth / 2)
                .attr('y', boxHeight + 55)
                .attr('text-anchor', 'middle')
                .attr('class', 'pipeline-detail');

            pipelineDetailLines.forEach((line, i) => {
                pipelineDetailText.append('tspan')
                    .attr('x', boxWidth / 2)
                    .attr('dy', i === 0 ? "0em" : "1.3em")
                    .text(line);
            });

            let visible = false;
            boxGroup.on('click', function () {
                visible = !visible;
                pipelineDetailText.classed('is-visible', visible);
            });
        }

        // Draw forward arrow to next box (except for last box)
        if (i < boxes.length - 1) {
            const forwardArrow = g.append('line')
                .attr('class', 'pipeline-forward-arrow')
                .attr('x1', x + boxWidth)
                .attr('y1', boxHeight / 2)
                .attr('x2', x + boxWidth + boxSpacing)
                .attr('y2', boxHeight / 2)
                .attr('stroke', '#333')
                .attr('stroke-width', 3)
                .attr('marker-end', 'url(#arrowhead)')

            // Add click handler to show all hidden arrows
            forwardArrow.on('click', function (event) {
                event.stopPropagation();

                // Calculate durations for consistent speed across all animated paths
                // First, collect all animated paths and their lengths
                const animatedPathData = [];
                hiddenArrows.forEach(function (arrow) {
                    if (arrow) {
                        const hasDashArray = arrow.attr('stroke-dasharray');
                        if (hasDashArray) {
                            const pathLength = arrow.datum() || arrow.node().getTotalLength();
                            animatedPathData.push({ arrow: arrow, length: pathLength });
                        }
                    }
                });

                // Calculate reference duration and scale proportionally
                // Use a reference duration for the longest path, scale others proportionally
                const referenceDuration = 50000; // milliseconds for reference path
                const maxLength = animatedPathData.length > 0
                    ? Math.max(...animatedPathData.map(d => d.length))
                    : 1; // Avoid division by zero

                hiddenArrows.forEach(function (arrow) {
                    if (arrow) {
                        // Check if this is an animated dashed path (has stroke-dasharray)
                        const hasDashArray = arrow.attr('stroke-dasharray');
                        if (hasDashArray) {
                            // For animated paths, restart the animation with speed-adjusted duration
                            // Get the stored totalLength from datum
                            const pathLength = arrow.datum() || arrow.node().getTotalLength();

                            // Calculate duration for this path to maintain constant speed
                            // Speed = distance / time, so time = distance * (referenceTime / referenceDistance)
                            const duration = referenceDuration * (pathLength / maxLength);

                            arrow
                                .interrupt() // Stop any current animation
                                .attr('opacity', 1)
                                .style('pointer-events', 'auto')
                                .attr('stroke-dashoffset', pathLength) // Reset to start
                                .transition()
                                .duration(duration)
                                .ease(d3.easeLinear)
                                .attr('stroke-dashoffset', 0)
                                .on('end', function repeat() {
                                    const path = d3.select(this);
                                    const storedLength = path.datum() || pathLength;
                                    const pathDuration = referenceDuration * (storedLength / maxLength);
                                    path
                                        .attr('stroke-dashoffset', storedLength)
                                        .transition()
                                        .duration(pathDuration)
                                        .ease(d3.easeLinear)
                                        .attr('stroke-dashoffset', 0)
                                        .on('end', repeat);
                                });
                        } else {
                            // For regular arrows, just show them
                            arrow
                                .transition()
                                .duration(300)
                                .ease(d3.easeLinear)
                                .attr('opacity', 1)
                        }
                    }
                });
            });
        }

        // Draw backward arrow below each box
        const arrowOffsetY = boxHeight + 40; // Position below the box
        const arrowCurveHeight = 10; // Height of the curve
        const arrowWidth = boxWidth * 0.6; // Width of the arrow loop

        // Create a curved path that loops back to the box
        const startX = x + boxWidth * 0.65; // Start from right side of box
        const startY = boxHeight + 1; // Start below the box
        const endX = x + boxWidth * 0.35; // End at left side of box
        const endY = boxHeight + 1; // End below the box
        const controlX1 = x + boxWidth / 2; // Control point for curve
        const controlY1 = arrowOffsetY + arrowCurveHeight;

        // Use quadratic bezier curve for smooth loop
        const backwardArrowPath = g.append('path')
            .attr('transform', `translate(${boxWidth * 0.2}, 0)`)
            .attr('d', `M ${startX} ${startY} Q ${controlX1} ${controlY1}, ${endX} ${endY}`)
            .attr('fill', 'none')
            .attr('stroke', '#333')
            .attr('stroke-width', 3)
            .attr('marker-end', 'url(#arrowhead)')
            .attr('opacity', 0) // Initially hidden
            .style('pointer-events', 'none'); // Disable pointer events when hidden

        // Store backward arrow in hidden arrows array
        hiddenArrows.push(backwardArrowPath);
    });

    // Draw arrow above boxes connecting first box (index 0) to third box (index 2)
    // Path: up from first box, horizontal to third box, down to third box
    const firstBoxX = 0 * (boxWidth + boxSpacing);
    const thirdBoxX = 2 * (boxWidth + boxSpacing);
    const arrowHeight = -40; // Height above the boxes (negative since boxes are at y=0 in the group)

    // Calculate positions
    const startX = firstBoxX + boxWidth / 1.5; // Top center of first box
    const startY = 0; // Top of first box
    const horizontalY = arrowHeight - 10; // Horizontal segment height
    const endX = thirdBoxX + boxWidth / 3; // Top center of third box
    const endY = 0; // Top of third box

    // Create path: M (move to start), L (line to) for each segment
    const arrowPath1 = `M ${startX} ${startY} L ${startX} ${horizontalY} L ${endX} ${horizontalY} L ${endX} ${endY}`;

    // Compute path length for dash animation
    // Since the path is made of 3 straight segments, we sum their lengths:
    function dist(x0, y0, x1, y1) {
        return Math.sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1));
    }
    const len1 = dist(startX, startY, startX, horizontalY);
    const len2 = dist(startX, horizontalY, endX, horizontalY);
    const len3 = dist(endX, horizontalY, endX, endY);
    const totalLength1 = len1 + len2 + len3;

    // Append the path, style as dashed and animate dashoffset (start to end)
    const animatedDashedPath = g.append('path')
        .attr('d', arrowPath1)
        .attr('fill', 'none')
        .attr('stroke', '#333')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '15,5')
        .attr('stroke-dashoffset', totalLength1)
        .attr('marker-end', 'url(#arrowhead)')
        .attr('marker-start', 'url(#arrowhead-start)')
        .attr('opacity', 0) // Initially hidden
        .style('pointer-events', 'none')
        .datum(totalLength1); // Store totalLength for later use

    // Store in hidden arrows array
    hiddenArrows.push(animatedDashedPath);



    // Draw arrow above boxes connecting first box (index 0) to fourth box (index 3)
    // Path: up from first box, horizontal to fourth box, down to fourth box
    const fourthBoxX = 3 * (boxWidth + boxSpacing);

    // Calculate positions
    const startX2 = firstBoxX + boxWidth / 2; // Top center of first box
    const startY2 = 0; // Top of first box
    const horizontalY2 = arrowHeight - 40; // Horizontal segment height (lower than first arrow)
    const endX2 = fourthBoxX + boxWidth / 1.5; // Top center of fourth box
    const endY2 = 0; // Top of fourth box

    // Create path: M (move to start), L (line to) for each segment
    const arrowPath2 = `M ${startX2} ${startY2} L ${startX2} ${horizontalY2} L ${endX2} ${horizontalY2} L ${endX2} ${endY2}`;

    // Compute path length for dash animation
    // Since the path is made of 3 straight segments, we sum their lengths:
    function dist(x0, y0, x1, y1) {
        return Math.sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1));
    }
    const len12 = dist(startX2, startY2, startX2, horizontalY2);
    const len22 = dist(startX2, horizontalY2, endX2, horizontalY2);
    const len32 = dist(endX2, horizontalY2, endX2, endY2);
    const totalLength2 = len12 + len22 + len32;
    // Append the path, style as dashed and animate dashoffset (start to end)
    const animatedDashedPath2 = g.append('path')
        .attr('d', arrowPath2)
        .attr('fill', 'none')
        .attr('stroke', '#333')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '15,5')
        .attr('stroke-dashoffset', totalLength2)
        .attr('marker-end', 'url(#arrowhead)')
        .attr('marker-start', 'url(#arrowhead-start)')
        .attr('opacity', 0) // Initially hidden
        .style('pointer-events', 'none') // Disable pointer events when hidden
        .datum(totalLength2); // Store totalLength for later use

    // Store in hidden arrows array
    hiddenArrows.push(animatedDashedPath2);


    // Draw single-headed arrow from third box (index 2) back to second box (index 1)
    // Path: up from third box, horizontal to second box, down to second box
    const secondBoxX = 1 * (boxWidth + boxSpacing);
    const horizontalY3 = arrowHeight + 10;

    // Calculate positions
    const startX3 = thirdBoxX + boxWidth / 5; // Start from third box
    const startY3 = 0;
    const endX3 = secondBoxX + boxWidth / 1.5; // End at second box
    const endY3 = 0;

    // Create path: M (move to start), L (line to) for each segment
    const arrowPath3 = `M ${startX3} ${startY3} L ${startX3} ${horizontalY3} L ${endX3} ${horizontalY3} L ${endX3} ${endY3}`;

    const arrow3 = g.append('path')
        .attr('d', arrowPath3)
        .attr('fill', 'none')
        .attr('stroke', '#333')
        .attr('stroke-width', 3)
        .attr('marker-end', 'url(#arrowhead)')
        .attr('opacity', 0) // Initially hidden
        .style('pointer-events', 'none'); // Disable pointer events when hidden

    // Store in hidden arrows array
    hiddenArrows.push(arrow3);

    // Draw single-headed arrow from fourth box (index 3) back to third box (index 2)
    // Path: up from fourth box, horizontal to third box, down to third box
    const thirdBoxX2 = 2 * (boxWidth + boxSpacing);
    const horizontalY4 = arrowHeight + 10;

    // Calculate positions
    const startX4 = fourthBoxX + boxWidth / 5; // Start from fourth box
    const startY4 = 0;
    const endX4 = thirdBoxX2 + boxWidth / 1.5; // End at third box
    const endY4 = 0;

    // Create path: M (move to start), L (line to) for each segment
    const arrowPath4 = `M ${startX4} ${startY4} L ${startX4} ${horizontalY4} L ${endX4} ${horizontalY4} L ${endX4} ${endY4}`;

    const arrow4 = g.append('path')
        .attr('d', arrowPath4)
        .attr('fill', 'none')
        .attr('stroke', '#333')
        .attr('stroke-width', 3)
        .attr('marker-end', 'url(#arrowhead)')
        .attr('opacity', 0) // Initially hidden
        .style('pointer-events', 'none'); // Disable pointer events when hidden

    // Store in hidden arrows array
    hiddenArrows.push(arrow4);

    // Draw single-headed arrow from fourth box (index 3) back to second box (index 1)
    // Path: up from fourth box, horizontal to second box, down to second box
    const secondBoxX2 = 1 * (boxWidth + boxSpacing);
    const horizontalY5 = arrowHeight - 25;

    // Calculate positions
    const startX5 = fourthBoxX + boxWidth / 2; // Start from fourth box
    const startY5 = 0;
    const endX5 = secondBoxX2 + boxWidth / 2; // End at second box
    const endY5 = 0;

    // Create path: M (move to start), L (line to) for each segment
    const arrowPath5 = `M ${startX5} ${startY5} L ${startX5} ${horizontalY5} L ${endX5} ${horizontalY5} L ${endX5} ${endY5}`;

    const arrow5 = g.append('path')
        .attr('d', arrowPath5)
        .attr('fill', 'none')
        .attr('stroke', '#333')
        .attr('stroke-width', 3)
        .attr('marker-end', 'url(#arrowhead)')
        .attr('opacity', 0) // Initially hidden
        .style('pointer-events', 'none'); // Disable pointer events when hidden

    // Store in hidden arrows array
    hiddenArrows.push(arrow5);
}

createPipelineDiagram();

