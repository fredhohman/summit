import * as d3 from "d3"

let layer = 'mixed4e'
let selectedClass = 0;

let leftInner = d3.select('#left')
    .append('div')
    .attr('id', 'left-inner')

let leftInnerOptions = leftInner.append('div')
    .attr('id', 'left-inner-options')

let leftInnerClassBarWrapper = leftInner.append('div')
    .attr('id', 'left-inner-class-bar-wrapper')

d3.json('./data/imagenet.json').then(function (data) {
    console.log(data);

    selectedClass = data[0];

    function computeEmbeddingDistancesFromPoint(data, point) {
        for (let i = 0; i < data.length; i++) {
            let distance = Math.sqrt(Math.pow(point.embedding[layer].x - data[i].embedding[layer].x, 2) + Math.pow(point.embedding[layer].y - data[i].embedding[layer].y, 2));
            data[i].distanceFromQueryPoint = distance
        }
    }
    computeEmbeddingDistancesFromPoint(data, selectedClass)


    function makeClassBars(data, selectedClass) {

        let classBars = leftInnerClassBarWrapper.selectAll('.class-bar')
            .data(data
                    .sort(function (x, y) {
                        return d3.ascending(x.distanceFromQueryPoint, y.distanceFromQueryPoint);
                    })
                    .filter(d => d.distanceFromQueryPoint < 2)
                )
            
            .enter()
            .append('div')
            .classed('class-bar', true)

        let classBarTexts = classBars.append('div')
            .classed('class-bar-text-wrapper', true)
        
        classBarTexts.append('div')
            .classed('class-bar-text-name', true)
            .text(d => d.name)

        classBarTexts.append('div')
            .classed('class-bar-text-instances', true)
            .text(d => d.numOfInstances)

        classBarTexts.append('div')
            .classed('class-bar-text-accuracy', true)
            .text(d => d.topOneAcc.toFixed(2))

        classBarTexts.append('div')
            .classed('class-bar-text-histogram', true)
            .text('h')

        let classBarBars = classBars.append('div')
            .classed('class-bar-bar-wrapper', true)
        
        let classBarBarsScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.distanceFromQueryPoint))
            .range([100, 0])
        
        console.log(d3.extent(data, d => d.distanceFromQueryPoint))

        classBarBars = classBarBars.append('div')
            .classed('class-bar-bar-background', true)
            .append('div')
            .classed('class-bar-bar-data', true)
            .style('width', d => classBarBarsScale(d.distanceFromQueryPoint) + '%')

        

    }
    makeClassBars(data)

});
