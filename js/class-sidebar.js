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
let selectedClassIdx = 0;
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

    let selectedClass = data[selectedClassIdx];
    console.log('selectedClass', selectedClass)

    leftInnerOptions.append('button')
        .attr('type', 'button')
        .text('sort class by accuracy (asc)')
        .on('click', () => {
            removeClassBars()
            document.getElementById('left-inner-class-bar-wrapper').scrollTop = 0;
            makeClassBars(data, selectedClass, 'asc')
        })

    leftInnerOptions.append('button')
        .attr('type', 'button')
        .text('sort class by accuracy (dsc)')
        .on('click', () => {
            removeClassBars()
            document.getElementById('left-inner-class-bar-wrapper').scrollTop = 0;
            makeClassBars(data, selectedClass, 'dsc')
        })

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


    function makeClassBars(data, selectedClass, sortType) {
        // sortTypes:
        // 'dis': sort by class distance
        // 'asc': sort by class accuracy ascending
        // 'dsc': sort by class accuracy descending
        console.log(sortType)


        computeEmbeddingDistancesFromPointCosine(data, selectedClass)

        let classBars;

        if (sortType === 'asc') {
            classBars = leftInnerClassBarWrapper.selectAll('.class-bar')
            .data(data
                .sort(function (x, y) {
                    return d3.ascending(x.topOneAcc, y.topOneAcc);
                })
                .slice(0, numClassesInClassBar)
            )
            .enter()
            .append('div')
            .classed('class-bar', true)

        } else if (sortType === 'dsc') {
            classBars = leftInnerClassBarWrapper.selectAll('.class-bar')
            .data(data
                .sort(function (x, y) {
                    return d3.descending(x.topOneAcc, y.topOneAcc);
                })
                .slice(0, numClassesInClassBar)
            )
            .enter()
            .append('div')
            .classed('class-bar', true)

        } else if (sortType === 'dis') {
            classBars = leftInnerClassBarWrapper.selectAll('.class-bar')
            .data(data
                .sort(function (x, y) {
                    return d3.descending(x.distanceFromQueryPoint, y.distanceFromQueryPoint);
                })
                .slice(0, numClassesInClassBar) // nearest n classes
            )
            .enter()
            .append('div')
            .classed('class-bar', true)
        }

        let classBarTexts = classBars.append('div')
            .classed('class-bar-text-wrapper', true)
            .on('click', d => {
                removeClassBars()
                document.getElementById('left-inner-class-bar-wrapper').scrollTop = 0;
                makeClassBars(data, d, 'dis')
            })
        
        classBarTexts.append('div')
            .classed('class-bar-text-name', true)
            .append('a')
            .text(d => d.name.replace(/_/g, ' ').toLowerCase())
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
            // .style('border', '1px solid #eeeeee') // for debugging
            .append("g")
            .attr("transform", "translate(" + accuracyMargin.left + "," + accuracyMargin.top + ")")
            .attr('id', d => 'accuracy-' + d.synset)

        function makeAccuracyHistogram(c) {
            let accuracySVG = d3.select('#accuracy-' + c.synset)

            let accuracyX = d3.scaleLinear()
                .domain(d3.extent(c.accuracies)).nice()
                .range([0, accuracyWidth])

            let bins = d3.histogram()
                .domain(accuracyX.domain())
                .thresholds(accuracyX.ticks(20))
                (c.accuracies)

            let accuracyY = d3.scaleLinear()
                .domain([0, d3.max(bins, d => d.length)]).nice()
                .range([accuracyHeight, 0])

            let xAxis = accuracySVG
                .append('g')
                .attr("transform", "translate(0," + accuracyHeight + ")")
                .classed('accuracy-x-axis', true)
                .call(d3.axisBottom(accuracyX).tickSizeOuter(0).ticks(0))

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
    makeClassBars(data, selectedClass, 'dis')

});

function removeClassBars() {
    d3.selectAll('.class-bar').remove()
}
