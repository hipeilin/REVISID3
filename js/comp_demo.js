function showComparisonDemo() {
    const div = d3.select('#comparisonDemoDiv');
    
    // Clear existing content
    div.selectAll('*').remove();
    
    // Center container using flex for any children (including the image)
    div.style('display', 'flex')
        .style('justify-content', 'center')
        .style('align-items', 'center');
    
    // Append the centered image
    div.append('img')
        .attr('src', 'img/comp_view.jpg')
        .style('max-width', '35%')
        .style('height', 'auto')
        .style('display', 'block')
        .style('margin', 'auto');
}