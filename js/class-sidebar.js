import * as d3 from "d3"
import similarity from "compute-cosine-similarity"

const layerChannelCounts = {
    'mixed3a': 256,
    'mixed3b': 480,
    'mixed4a': 508,
    'mixed4b': 512,
    'mixed4c': 512,
    'mixed4d': 528,
    'mixed4e': 832,
    'mixed5a': 832,
    'mixed5b': 1024
}

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
    console.log('selectedClass', selectedClass)

    function computeEmbeddingDistancesFromPointEuclidean(data, point) {
        for (let i = 0; i < data.length; i++) {
            let distance = Math.sqrt(Math.pow(point.embedding[layer].x - data[i].embedding[layer].x, 2) + Math.pow(point.embedding[layer].y - data[i].embedding[layer].y, 2));
            data[i].distanceFromQueryPoint = distance
        }
    }
    // computeEmbeddingDistancesFromPointEuclidean(data, selectedClass)

    function computeEmbeddingDistancesFromPointCosine(data, point) {

        function topChannelsToVector(point, layer) {
            let pointVector = new Array(layerChannelCounts[layer]).fill(0);
            point.topChannels[layer].forEach(channel => {
                pointVector[channel.channel] = channel.count;
            });
            return pointVector
        }

        let selectedPointVector = topChannelsToVector(point, layer)

        for (let i = 0; i < data.length; i++) {
            let iterPointVector = topChannelsToVector(data[i], layer)

            let distance = (1 - similarity(selectedPointVector, iterPointVector))/2
            data[i].distanceFromQueryPoint = distance
        }
    }
    computeEmbeddingDistancesFromPointCosine(data, selectedClass)


    function makeClassBars(data, selectedClass) {

        let classBars = leftInnerClassBarWrapper.selectAll('.class-bar')
            .data(data
                    .sort(function (x, y) {
                        return d3.ascending(x.distanceFromQueryPoint, y.distanceFromQueryPoint);
                    })
                    // .filter(d => d.distanceFromQueryPoint < 2)
                    .slice(0, 500)
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
            .domain([0, 1])
            .range([100, 0])
        
        console.log(d3.extent(data, d => d.distanceFromQueryPoint))

        classBarBars.append('div')
            .classed('class-bar-bar-data', true)
            .style('width', d => classBarBarsScale(d.distanceFromQueryPoint) + '%')

        classBarBars.append('div')
            .classed('class-bar-bar-background', true)
            .style('width', d => 100-classBarBarsScale(d.distanceFromQueryPoint) + '%')
    

        

    }
    makeClassBars(data)

});
