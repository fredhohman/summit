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

let layer = 'mixed4e';
let selectedClass = 0;
const numClassesInClassBar = 250;

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
            let distance = similarity(selectedPointVector, iterPointVector)
            data[i].distanceFromQueryPoint = distance
        }
    }
    computeEmbeddingDistancesFromPointCosine(data, selectedClass)


    function makeClassBars(data, selectedClass) {

        let classBars = leftInnerClassBarWrapper.selectAll('.class-bar')
            .data(data
                    .sort(function (x, y) {
                        return d3.descending(x.distanceFromQueryPoint, y.distanceFromQueryPoint);
                    })
                    // .filter(d => d.distanceFromQueryPoint < 2)
                    .slice(0, numClassesInClassBar) // nearest n classes
                )
            
            .enter()
            .append('div')
            .classed('class-bar', true)

        let classBarTexts = classBars.append('div')
            .classed('class-bar-text-wrapper', true)
        
        classBarTexts.append('div')
            .classed('class-bar-text-name', true)
            .append('a')
            .text(d => d.name.replace('_', ' ').toLowerCase())
            .attr('target', '_blank')
            .attr('href', d => 'http://www.google.com/search?q=' + d.name.replace('_', '+').toLowerCase())

        classBarTexts.append('div')
            .classed('class-bar-text-instances', true)
            .text(d => d.numOfInstances)

        classBarTexts.append('div')
            .classed('class-bar-text-accuracy', true)
            .text(d => (100 * d.topOneAcc).toFixed(1) + '%')

        let classBarHistograms = classBarTexts.append('div')
            .classed('class-bar-text-histogram', true)
            // .text('h')

        const accuracyMargin = { top: 2, right: 0, bottom: 2, left: 0 }
        const accuracyWidth = 100 - accuracyMargin.left - accuracyMargin.right // 100 from flex-basis width of class-bar-text-accuracy
        const accuracyHeight = 25 - accuracyMargin.top - accuracyMargin.bottom // 100 from flex-basis width of class-bar-text-accuracy

        classBarHistograms
            .append('svg')
            .attr("width", accuracyWidth + accuracyMargin.left + accuracyMargin.right)
            .attr("height", accuracyHeight + accuracyMargin.top + accuracyMargin.bottom)
            // .style('border', '1px solid #eeeeee')
            // .attr('id', d => 'accuracy-' + d.synset)
            .append("g")
            .attr("transform", "translate(" + accuracyMargin.left + "," + accuracyMargin.top + ")")
            .attr('id', d => 'accuracy-' + d.synset)

        function makeAccuracyHistogram(c) {
            let accuracySVG = d3.select('#accuracy-' + c.synset)
            // let accuracyG = d3.select('#accuracy-g-' + c.synset)

            let accuracyX = d3.scaleLinear()
                .domain(d3.extent(c.accuracies)).nice()
                .range([0, accuracyWidth])

            let bins = d3.histogram()
                .domain(accuracyX.domain())
                .thresholds(accuracyX.ticks(20))
                (c.accuracies)

            let accuracyY = d3.scaleLinear()
                .domain([0, d3.max(bins, d => d.length)]).nice()
                // .domain([0, 1300])
                .range([accuracyHeight, 0])

            let xAxis = accuracySVG
                .append('g')
                .attr("transform", "translate(0," + accuracyHeight + ")")
                .classed('accuracy-x-axis', true)
                .call(d3.axisBottom(accuracyX).tickSizeOuter(0).ticks(0))
            // .call(g => g.append("text")
            //     .attr("x", accuracyWidth - accuracyMargin.right)
            //     .attr("y", -4)
            //     .attr("fill", "#000")
            //     .attr("font-weight", "bold")
            //     .attr("text-anchor", "end")
            //     .text('accuracy')
            //     )

            // let yAxis = accuracySVG
            //     .append('g')
            //     // .attr("transform", "translate(" + accuracyMargin.left + ",0)")
            //     .call(d3.axisLeft(accuracyY).ticks(0))
            // .call(g => g.select(".domain").remove())
            // // .call(g => g.select(".tick:last-of-type text").clone()
            // //     .attr("x", 4)
            // //     .attr("text-anchor", "start")
            // //     .attr("font-weight", "bold")
            // //     .text('count'))

            accuracySVG
                .append("g")
                .selectAll("rect")
                .data(bins)
                .enter().append("rect")
                .classed('accuracy-bar', true)
                .attr("x", d => accuracyX(d.x0) + 1)
                .attr("width", d => Math.max(0, accuracyX(d.x1) - accuracyX(d.x0) - 1))
                .attr("y", d => accuracyY(d.length))
                .attr("height", d => accuracyY(0) - accuracyY(d.length));
        }

        for (let i = 0; i < data.length; i++) {
            makeAccuracyHistogram(data[i])
        }

        let classBarBars = classBars.append('div')
            .classed('class-bar-bar-wrapper', true)
        
        let classBarBarsScale = d3.scaleLinear()
            .domain([0, 1]) // cosine similarity
            .range([0, 100]) // div width percentage
        
        classBarBars.append('div')
            .classed('class-bar-bar-data', true)
            .style('width', d => classBarBarsScale(d.distanceFromQueryPoint) + '%')

        classBarBars.append('div')
            .classed('class-bar-bar-background', true)
            .style('width', d => 100-classBarBarsScale(d.distanceFromQueryPoint) + '%')
    

        

    }
    makeClassBars(data)

});
