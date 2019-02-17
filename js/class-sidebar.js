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
        leftInnerClassBarWrapper.selectAll('.class-bar')
            .data(data.filter(d => d.label < 20))
            .enter()
            .append('div')
            .classed('class-bar', true)
            .text(d => d.name)

    }
    makeClassBars(data)

});
