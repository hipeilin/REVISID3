        

        // ===== SVG INTERACTIVITY =====

        // Slide 2: Color changing circles
        document.querySelectorAll('#colorSvg .interactive-circle').forEach(circle => {
            let colorIndex = 0;
            circle.addEventListener('click', function() {
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
            bar.addEventListener('click', function() {
                const newHeight = Math.random() * 150 + 50;
                const newY = 300 - newHeight;
                this.setAttribute('height', newHeight);
                this.setAttribute('y', newY);
            });
        });