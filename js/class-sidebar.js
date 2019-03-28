import * as d3 from "d3"
import similarity from "compute-cosine-similarity"
import { dagVIS, removeDagVIS } from "./attribution-graph";
// import { FUNCTION } from './awesomeplete'
// import { evokeSearchBar } from './searchbar'
// let dropdown = require('semantic-ui-dropdown')
let awesomplete = require('awesomplete')

// webpack variables
// console.log(dataURL)

function reloadPage() {
    window.location.reload();
}
d3.select("#header-title").on("click", reloadPage);

export const layerChannelCounts = {
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

let layer = 'mixed4d';
// let selectedClassIdx = 962;
const numClassesInClassBar = 250;
let k = 1; // embedding zoom scale
const kZoomLabelThreshold = 10;
const embeddingTransitionDuration = 1800

// left
let leftInner = d3.select('#left')
    .append('div')
    .attr('id', 'left-inner')

let leftInnerEmbeddingOptions = leftInner.append('div')
    .attr('id', 'left-inner-embedding-options')

let leftInnerEmbedding = leftInner.append('div')
    .attr('id', 'left-inner-embedding')

let leftInnerClassBarOptions = leftInner.append('div')
    .attr('id', 'left-inner-class-bar-options')
    
let leftInnerClassBarWrapper = leftInner.append('div')
    .attr('id', 'left-inner-class-bar-wrapper')
    .on('scroll', () => {
        colorEmbeddingPointsInViewbox()
    })

// middle
// let middleInner = d3.select('#middle')
//     .append('div')
//     .attr('id', 'middle-inner')

// let middleInnerOptions = middleInner.append('div')
//     .attr('id', 'middle-inner-options')

// let middleInnerEmbeddingWrapper = middleInner.append('div')
//     .attr('id', 'middle-inner-embedding-wrapper')

// right
let rightInner = d3.select('#right')
    .append('div')
    .attr('id', 'right-inner')

let rightInnerOptions = rightInner.append('div')
    .attr('id', 'right-inner-options')

let rightInnerDagWrapper = rightInner.append('div')
    .attr('id', 'right-inner-dag-wrapper')

const formatNumberThousands = d3.format(',')

// accuracy histogram sizing
const accuracyMargin = { top: 0, right: 0, bottom: 1, left: 0 }
const accuracyWidth = 120 - accuracyMargin.left - accuracyMargin.right // 100 from flex-basis width of class-bar-text-accuracy
const accuracyHeight = 20 - accuracyMargin.top - accuracyMargin.bottom // 100 from flex-basis width of class-bar-text-accuracy

// global variable
let selectedSynset;
export var selectedClass;
var selectedLabel;
let prevClassesSynset = [];

d3.json(dataURL + 'data/imagenet.json').then(function (data) {

    // console.log(data);
    // window.data = data

    d3.select('#classes-value').text(formatNumberThousands(data.length))
    d3.select('#instances-value').text(formatNumberThousands(d3.sum(data, d => d.numOfInstances)))

    selectedClass = data.filter(d => d['name'] === 'white_wolf')[0]
    selectedSynset = selectedClass.synset

    // const accuracyBinMax = computeAccuracyMax(data)
    const accuracyBinMax = 1300

    leftInnerClassBarOptions
        .append('div')
        .classed('left-inner-option-wrapper', true)
        .append('div')
        .attr('id', 'search')
    
    genSearchBar(data, accuracyBinMax)

    let leftInnerClassBarOptionsButtonWrapper = leftInnerClassBarOptions
        .append("div")
        .style('display', 'flex')
        .style('padding-right', '16px')

    leftInnerClassBarOptionsButtonWrapper
        .append('div')
        .classed('left-inner-option-wrapper', true)
        .append('button')
        .attr('type', 'button')
        .classed('square-button', true)
        // .text('Accuracy ascending')
        .on('click', () => {
            removeClassBars()
            document.getElementById('left-inner-class-bar-wrapper').scrollTop = 0;
            selectedClass = data.filter(d => d['synset'] === selectedSynset)[0]
            makeClassBars(data, layer, selectedClass, 'dis', accuracyBinMax)
        })
        .append('i')
        .classed('material-icons', true)
        .classed('md-24', true)
        .text('sort')
        .attr('title', 'Sort classes by selected class similarity')

    leftInnerClassBarOptionsButtonWrapper
        .append('div')
        .classed('left-inner-option-wrapper', true)
        .append('button')
        .attr('type', 'button')
        .classed('square-button', true)
        // .text('Accuracy ascending')
        .on('click', () => {
            removeClassBars()
            document.getElementById('left-inner-class-bar-wrapper').scrollTop = 0;
            selectedClass = data.filter(d => d['synset'] === selectedSynset)[0]
            makeClassBars(data, layer, selectedClass, 'asc', accuracyBinMax)
        })
        .append('i')
        .classed('material-icons', true)
        .classed('md-24', true)
        .text('arrow_downward')
        .attr('title', 'Sort classes by accuracy (descending)')

    leftInnerClassBarOptionsButtonWrapper
        .append('div')
        .classed('left-inner-option-wrapper', true)
        .append('button')
        .attr('type', 'button')
        // .text('Accuracy descending')
        .classed('square-button', true)
        .on('click', () => {
            removeClassBars()
            document.getElementById('left-inner-class-bar-wrapper').scrollTop = 0;
            selectedClass = data.filter(d => d['synset'] === selectedSynset)[0]
            makeClassBars(data, layer, selectedClass, 'dsc', accuracyBinMax)
        })
        .append('i')
        .classed('material-icons', true)
        .classed('md-24', true)
        .text('arrow_upward')
        .attr('title', 'Sort classes by accuracy (ascending)')

    function computeEmbeddingDistancesFromPointEuclidean(data, layer, point) {
        for (let i = 0; i < data.length; i++) {
            let distance = Math.sqrt(Math.pow(point.embed[layer].x - data[i].embed[layer].x, 2) + Math.pow(point.embed[layer].y - data[i].embed[layer].y, 2));
            data[i].distanceFromQueryPoint = distance
        }
    }
    computeEmbeddingDistancesFromPointCosine(data, layer, selectedClass)

    makeClassBars(data, layer, selectedClass, 'dis', accuracyBinMax)

    // embedding
    function makeEmbedding(data, layer) {
        // console.log('make embedding')

            {/* < div class="header-content" >
                <span id="dataset-name" class="smalltext-header">dataset</span>
                <div id="dataset-value" class="header-value">ImageNet</div>
                </div > */}

        let leftInnerEmbeddingOptionsLabel = leftInnerEmbeddingOptions
            .append('div')
            .classed('left-inner-option-wrapper', true)

        leftInnerEmbeddingOptionsLabel
            .append('span')
            .classed("smalltext-header", true)
            .style('color', '#666666')
            .text('layer')

        leftInnerEmbeddingOptionsLabel
            .append('div')
            .classed("header-value", true)
            .text('mixed')
        
        // let embeddingSelect = middleInnerOptions
        //     .append('select')
        //     .attr('id', 'embedding-select')

        // embeddingSelect
        //     .selectAll('.embedding-select-options')
        //     .data(Object.keys(layerChannelCounts))
        //     .enter()
        //     .append('option')
        //     .text(d => { return d })
        //     .attr('value', d => { return d })

        // embeddingSelect
        //     .on('change', () => {
        //         layer = document.getElementById('embedding-select').value
        //         centerEmbedding()
        //         updateEmbedding(layer)
        //     })

        const netMargin = ({ top: 0, right: 20, bottom: 0, left: 20 })
        const netWidth = 300 - netMargin.left - netMargin.right
        const netHeight = 64 - netMargin.top - netMargin.bottom
        const middleLineHeight = 25;

        let networkSVG = leftInnerEmbeddingOptions
            .append('svg')
            .attr('width', netWidth + 'px')
            .attr('height', netHeight + 'px')
            .append("g")
            .attr("transform", "translate(" + netMargin.left + "," + netMargin.top + ")")
            .attr('id', 'net')
        
        let layers = Object.keys(layerChannelCounts);

        const netLayerWidth = 20
        const netLayerPadding = (netWidth - netMargin.left - netMargin.right - (layers.length-1) * netLayerWidth) / layers.length

        networkSVG
            .append('line')
            .attr('x1', 0)
            .attr('x2', layers.length * netLayerWidth + (layers.length - 1) * netLayerPadding)
            .attr('y1', middleLineHeight)
            .attr('y2', middleLineHeight)
            .style('stroke', 'rgba(0, 0, 0, 0.15)')
            
        networkSVG
            .selectAll('.layer-glyph')
            .data(layers)
            .enter()
            .append('rect')
            .attr('x', (d, i) => i * (netLayerWidth + netLayerPadding))
            .attr('y', 10)
            .attr('width', netLayerWidth)
            .attr('height', middleLineHeight+5)
            .classed('layer-glyph', true)
            .attr('id', d => 'layer-glyph-' + d)
            .on('click', (d) => {

                // update layer 
                layer = d

                // update classbars (takes a little time to recompute cosine similarity)
                selectedClass = data.filter(d => d['synset'] === selectedSynset)[0]
                computeEmbeddingDistancesFromPointCosine(data, layer, selectedClass)
                removeClassBars()
                document.getElementById('left-inner-class-bar-wrapper').scrollTop = 0;
                makeClassBars(data, layer, selectedClass, 'dis', accuracyBinMax)

                // update embedding
                centerEmbedding()
                updateEmbedding(layer)
                d3.selectAll('.layer-glyph')
                    .classed('layer-glyph-selected', false)
                d3.select('#layer-glyph-' + layer)
                    .classed('layer-glyph-selected', true)

                // update selected points
                colorEmbeddingPointsInViewbox()
                highlightEmbeddingPointLabel(selectedClass.synset, getCssVar('--highlight-clicked'))
                selectedLabel = selectedClass.name
                updateSearchBarText()

            })

        networkSVG
            .selectAll('.layer-glyph-label')
            .data(layers)
            .enter()
            .append('text')
            .text(d => d.slice(5))
            .attr('x', (d, i) => i * (netLayerWidth + netLayerPadding) + netLayerWidth/2)
            .attr('y', netHeight - 10)
            .attr('text-anchor', 'middle')
            .classed('layer-glyph-label', true)
            .on('click', (d) => {

                // update layer 
                layer = d

                // update classbars (takes a little time to recompute cosine similarity)
                selectedClass = data.filter(d => d['synset'] === selectedSynset)[0]
                computeEmbeddingDistancesFromPointCosine(data, layer, selectedClass)
                removeClassBars()
                document.getElementById('left-inner-class-bar-wrapper').scrollTop = 0;
                makeClassBars(data, layer, selectedClass, 'dis', accuracyBinMax)

                // update embedding
                centerEmbedding()
                updateEmbedding(layer)
                d3.selectAll('.layer-glyph')
                    .classed('layer-glyph-selected', false)
                d3.select('#layer-glyph-' + layer)
                    .classed('layer-glyph-selected', true)

                // update selected points
                colorEmbeddingPointsInViewbox()
                highlightEmbeddingPointLabel(selectedClass.synset, getCssVar('--highlight-clicked'))
                selectedLabel = selectedClass.name
                updateSearchBarText()

            })
        
        leftInnerEmbeddingOptions
            .append('div')
            .classed('left-inner-option-wrapper', true)
            .style('padding-right', '16px')
            .append('button')
            .attr('type', 'button')
            .classed('square-button', true)
            .on('click', () => {
                centerEmbedding()
            })
            .attr('title', 'Reset zoom')
            .append('i')
            .classed('material-icons', true)
            .classed('md-24', true)
            .text('zoom_out_map')

        d3.select('#layer-glyph-' + layer)
            .classed('layer-glyph-selected', true) // init selected layer

        const embeddingMargin = ({ top: 40, right: 40, bottom: 40, left: 40 })
        const embeddingWidth = 400 - embeddingMargin.left - embeddingMargin.right // 400 from #left.flex
        const embeddingHeight = 400 - embeddingMargin.top - embeddingMargin.bottom // 400 from #left.flex

        let embeddingSVG = leftInnerEmbedding
            .append('svg')
            .attr('viewBox', '0 0 ' + (embeddingWidth + embeddingMargin.left + embeddingMargin.right) + ' ' + (embeddingHeight + embeddingMargin.top + embeddingMargin.bottom))
            .attr('width', '100%')
            // .attr("width", embeddingWidth + embeddingMargin.left + embeddingMargin.right)
            // .attr("height", embeddingHeight + embeddingMargin.top + embeddingMargin.bottom)
            // .style('border', '1px solid #eeeeee') // for debugging

        let zoom = d3.zoom()
            .scaleExtent([.4, 150])
            .extent([[0, 0], [embeddingWidth, embeddingHeight]])
            .on("zoom", zoomed);

        let embeddingXZoomScale;
        let embeddingYZoomScale;
        function zoomed() {
            // create new scale objects based on event
            embeddingXZoomScale = d3.event.transform.rescaleX(embeddingX);
            embeddingYZoomScale = d3.event.transform.rescaleY(embeddingY);
            // update axes
            // gX.call(xAxis.scale(embeddingXZoomScale));
            // gY.call(yAxis.scale(embeddingYZoomScale));
            embeddingPoints
                .attr('cx', function (d) { return embeddingXZoomScale(d.embed[layer].x) })
                .attr('cy', function (d) { return embeddingYZoomScale(d.embed[layer].y) })
            embeddingG.selectAll('.embedding-point-label')
                .attr('x', d => embeddingXZoomScale(d.embed[layer].x) + 7)
                .attr('y', d => embeddingYZoomScale(d.embed[layer].y) + 4)

            k = d3.event.transform.k;

            if (k > kZoomLabelThreshold) {
                d3.selectAll('.embedding-point-label')
                    .text(d => d.name.replace(/_/g, ' ').toLowerCase())   
            } else {
                d3.selectAll('.embedding-point-label')
                    .text('')

                highlightEmbeddingPointLabel(selectedSynset, getCssVar('--highlight-clicked'))
            }
        }

        function centerEmbedding() {
            zoomRect.transition().duration(750).call(zoom.transform, d3.zoomIdentity.scale(1));
        }

        let zoomRect = embeddingSVG.append("rect")
            .attr("width", embeddingWidth + embeddingMargin.left + embeddingMargin.right)
            .attr("height", embeddingHeight + embeddingMargin.top + embeddingMargin.bottom)
            .style("fill", "none")
            .style("pointer-events", "all")
            // .attr('transform', 'translate(' + embeddingMargin.left + ',' + embeddingMargin.top + ')')
            .call(zoom)
            // .on('mouseover', function () {
            //     console.log('over')
            //     d3.select(this).style("cursor", "grab");
            // })
            // .on('mousedown', function () {
            //     console.log('down')
            //     d3.select(this).style("cursor", "grabbing");
            // })

        let embeddingG = embeddingSVG
            .append("g")
            .attr("transform", "translate(" + embeddingMargin.left + "," + embeddingMargin.top + ")")
            .attr('id', 'embedding')
        // .call(zoom);

        embeddingSVG.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", embeddingWidth)
            .attr("height", embeddingHeight);

        function computeEmbeddingDomain(data, layer) {
            let xExtent = d3.extent(data, d => d.embed[layer].x)
            let yExtent = d3.extent(data, d => d.embed[layer].y)

            let domainMin = d3.min([xExtent[0], yExtent[0]])
            let domainMax = d3.max([xExtent[1], yExtent[1]])

            return [domainMin, domainMax]
        }
        let embeddingDomain = computeEmbeddingDomain(data, layer)

        let embeddingX = d3.scaleLinear()
            .domain(d3.extent(data, d => d.embed[layer].x))
            // .domain(embeddingDomain)
            .range([0, embeddingWidth])

        let embeddingY = d3.scaleLinear()
            .domain(d3.extent(data, d => d.embed[layer].y))
            // .domain(embeddingDomain)
            .range([0, embeddingHeight])

        // we are using embeddingY everywhere to make the plot 1:1, but this is hardcoded right now!
        // we just want the most negative and most positive extend on the input range domain

        embeddingXZoomScale = embeddingX;
        embeddingYZoomScale = embeddingY;

        let embeddingPoints = embeddingG.append('g')
            .selectAll('.embedding-point')
            .data(data)
            .enter()
            .append('circle')
            .attr('r', 3)
            .attr('cx', d => embeddingX(d.embed[layer].x))
            .attr('cy', d => embeddingY(d.embed[layer].y))
            .classed('embedding-point', true)
            .attr('id', d => 'point-' + d.synset)
            .on('mouseover', d => {
                d3.select('#embedding-point-label-' + d.synset)
                    .text(d => d.name.replace(/_/g, ' ').toLowerCase())
                    .classed('embedding-point-label-selected', true)

                // tip.show(d, document.getElementById(d.id))
                // colorNearPoints(d)
                // drHoverCircle.style('visibility', 'visible')
                //     .attr('cx', embeddingXZoomScale(d.embed[layer].x))
                //     .attr('cy', embeddingYZoomScale(d.embed[layer].y))
                //     .attr('r', () => {
                //         let temp = embeddingXZoomScale(d.embed[layer].x + distanceRadius) - embeddingXZoomScale(d.embed[layer].x)
                //         return temp
                //     })
            })
            .on('mouseout', (d) => {
                d3.selectAll('.embedding-point-label')
                    .classed('embedding-point-label-selected', false)

                if (k < kZoomLabelThreshold) {
                    d3.selectAll('.embedding-point-label')
                        .text('')
                }

                d3.select('#embedding-point-label-' + selectedSynset)
                    .text(d => d.name.replace(/_/g, ' ').toLowerCase())
                    .classed('embedding-point-label-selected', true)

            //     tip.hide()
                // d3.selectAll('.embedding-point').style('fill', ' #666666')
                // d3.selectAll('.embedding-point-label').text('')
            //     drHoverCircle.style('visibility', 'hidden')
            })
            .on('click', (d) => {
                
                removeClassBars()
                document.getElementById('left-inner-class-bar-wrapper').scrollTop = 0;
                makeClassBars(data, layer, d, 'dis', accuracyBinMax)
                
                removeDagVIS()
                dagVIS(d)
            
                colorEmbeddingPointsInViewbox()
                highlightEmbeddingPointLabel(d.synset, getCssVar('--highlight-clicked'))
                selectedLabel = d.name
                updateSearchBarText()
            })

        embeddingG.selectAll('.embedding-point-label')
            .data(data)
            .enter()
            .append('text')
            .attr('id', d => 'embedding-point-label-' + d.synset)
            .classed('embedding-point-label', true)
            .attr('x', d => embeddingX(d.embed[layer].x))
            .attr('y', d => embeddingY(d.embed[layer].y))
            .on('mouseover', d => {
                d3.select('#embedding-point-label-' + d.synset)
                    .text(d => d.name.replace(/_/g, ' ').toLowerCase())
                    .classed('embedding-point-label-selected', true)
            })
            .on('mouseout', (d) => {
                // console.log('mouseout3')
                d3.selectAll('.embedding-point-label')
                    .classed('embedding-point-label-selected', false)

                if (k < kZoomLabelThreshold) {
                    d3.selectAll('.embedding-point-label')
                        .text('')
                }
                
                d3.select('#embedding-point-label-' + selectedSynset)
                    .text(d => d.name.replace(/_/g, ' ').toLowerCase())
                    .classed('embedding-point-label-selected', true)
            })
            .on('click', (d) => {
                removeClassBars()
                document.getElementById('left-inner-class-bar-wrapper').scrollTop = 0;
                makeClassBars(data, layer, d, 'dis', accuracyBinMax)
                removeDagVIS()
                dagVIS(d)
                colorEmbeddingPointsInViewbox()
                highlightEmbeddingPointLabel(d.synset, getCssVar('--highlight-clicked'))
                selectedLabel = d.name
                updateSearchBarText()
            })

        function updateEmbedding(newLayer) {

            embeddingDomain = computeEmbeddingDomain(data, newLayer)

            embeddingX = d3.scaleLinear()
                .domain(d3.extent(data, d => d.embed[layer].x))
                // .domain(embeddingDomain)
                .range([0, embeddingWidth])

            embeddingY = d3.scaleLinear()
                .domain(d3.extent(data, d => d.embed[layer].y))
                // .domain(embeddingDomain)
                .range([0, embeddingHeight])

            embeddingXZoomScale = embeddingX;
            embeddingYZoomScale = embeddingY;

            d3.selectAll('.embedding-point')
                .transition()
                .duration(embeddingTransitionDuration)
                .attr('cx', d => embeddingX(d.embed[newLayer].x))
                .attr('cy', d => embeddingY(d.embed[newLayer].y))

            d3.selectAll('.embedding-point-label-selected')
            .transition()
            .duration(embeddingTransitionDuration)
                .attr('x', d => embeddingXZoomScale(d.embed[layer].x) + 7)
                .attr('y', d => embeddingYZoomScale(d.embed[layer].y) + 4)

        }

    }

    // initial load in view
    makeEmbedding(data, layer)

    dagVIS(selectedClass)

    colorEmbeddingPointsInViewbox()
    highlightEmbeddingPointLabel(selectedClass.synset, getCssVar('--highlight-clicked'))
    selectedLabel = selectedClass.name
    updateSearchBarText()
    
});

function removeClassBars() {
    d3.selectAll('.class-bar').remove()
}

function makeClassBars(data, layer, selectedClass, sortType, accuracyBinMax) {
    // sortTypes:
    // 'dis': sort by class distance
    // 'asc': sort by class accuracy ascending
    // 'dsc': sort by class accuracy descending
    // console.log(sortType)

    computeEmbeddingDistancesFromPointCosine(data, layer, selectedClass)

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

    classBars
        .attr('id', d => 'class-bar-' + d.synset)
        .on('mouseover', d => {
            d3.select('#point-' + d.synset)
                .classed('embedding-point-hover', true)

            d3.select('#embedding-point-label-' + d.synset)
                .text(d => d.name.replace(/_/g, ' ').toLowerCase())
                .classed('embedding-point-label-selected', true)
                .moveToFront()

        })
        .on('mouseout', (d) => {
            d3.selectAll('.embedding-point')
                .classed('embedding-point-hover', false)

            d3.selectAll('.embedding-point-label')
                .classed('embedding-point-label-selected', false)            

            if (k < kZoomLabelThreshold) {
                d3.selectAll('.embedding-point-label')
                    .text('')
            }

            d3.select('#embedding-point-label-' + selectedSynset)
                .text(d => d.name.replace(/_/g, ' ').toLowerCase())
                .classed('embedding-point-label-selected', true)
        })
        .on('click', d => {
            removeClassBars()
            document.getElementById('left-inner-class-bar-wrapper').scrollTop = 0;
            makeClassBars(data, layer, d, 'dis', accuracyBinMax)
            // selectedClass = d
            removeDagVIS()
            dagVIS(d)
            colorEmbeddingPointsInViewbox()
            highlightEmbeddingPointLabel(d.synset, getCssVar('--highlight-clicked'))
            selectedLabel = d.name
            updateSearchBarText()
        })

    let classBarTexts = classBars
        .append('div')
        .classed('class-bar-text-wrapper', true)
    
    classBarTexts.append('div')
        .classed('class-bar-text-name', true)
        .append('a')
        .text(d => d.name.replace(/_/g, ' ').toLowerCase())
        .attr('target', '_blank')
        .attr('href', d => 'http://www.google.com/search?q=' + d.name.replace('_', '+').toLowerCase())

    // classBarTexts.append('div')
    //     .classed('class-bar-text-instances', true)
    //     .text(d => d.numOfInstances)

    // classBarTexts.append('div')
    //     .classed('class-bar-text-image', true)

    classBarTexts.append('div')
        .classed('class-bar-text-accuracy', true)
        .text(d => (100 * d.topOneAcc).toFixed(1) + '%')

    let classBarHistograms = classBarTexts.append('div')
        .classed('class-bar-text-histogram', true)
        // .text('h')

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
            .domain(d3.extent(c.accs)).nice()
            .range([0, accuracyWidth])

        let bins = d3.histogram()
            .domain(accuracyX.domain())
            .thresholds(accuracyX.ticks(20))
            (c.accs)

        let accuracyY = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)]).nice()
            // .domain([0, accuracyBinMax]).nice()
            .range([accuracyHeight, 0])

        let accuracyXAxis = accuracySVG
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
            .attr("x", d => accuracyX(d.x0)) // + 1?
            .attr("width", d => Math.max(0, accuracyX(d.x1) - accuracyX(d.x0) - 1))
            .attr("y", d => accuracyY(d.length))
            .attr("height", d => accuracyY(0) - accuracyY(d.length));

        // accuracySVG
        //     .append('text')
        //     .attr('x', accuracyWidth / 2)
        //     .attr('y', accuracyHeight / 2)
        //     // .attr('x', accuracyMargin.left)
        //     // .attr('y', accuracyHeight - accuracyMargin.bottom)
        //     .attr('text-anchor', 'middle')
        //     .text(d => (100 * d.topOneAcc).toFixed(1) + '%')
        //     .classed('class-bar-text-accuracy-svg', true)
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

function computeEmbeddingDistancesFromPointCosine(data, layer, point) {

    function topChannelsToVector(point, layer) {
        let pointVector = new Array(layerChannelCounts[layer]).fill(0);
        point.topChannels[layer].forEach(channel => {
            pointVector[channel.ch] = channel.ct;
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

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};

function highlightEmbeddingPointLabel(targetSynset, color) {

    highlightEmbeddingPoint(targetSynset, color)
    highlightEmbeddingLabel(targetSynset, color)

    if (targetSynset !== selectedSynset) {
        dehighlightEmbeddingPoint(selectedSynset)
        dehighlightEmbeddingLabel(selectedSynset)
        selectedSynset = targetSynset
    }
    
}

function highlightEmbeddingPoint(synset, color) {
    d3.select('#point-' + synset)
        .style('fill', color)
        .attr('r', '5')
        .moveToFront()
}

function highlightEmbeddingLabel(synset, color) {
    d3.select('#embedding-point-label-' + synset)
        .style('fill', color)
        .text(d => d.name.replace(/_/g, ' ').toLowerCase())
        .moveToFront()
}

function dehighlightEmbeddingPoint(synset) {
    d3.select('#point-' + synset)
        .style('fill', getCssVar('--dark'))
        .attr('r', '3')
}

function dehighlightEmbeddingLabel(synset) {
    d3.select('#embedding-point-label-' + synset)
        .style('fill', getCssVar('--dark'))
        .text('')
        
}

function colorEmbeddingPointsInViewbox() {
    let scrollView = document.getElementById('left-inner-class-bar-wrapper')
    let allClassesInSlide = scrollView.childNodes
    let scrollViewHeight = parseFloat(getComputedStyle(scrollView).getPropertyValue('height'))
    let classBlockTopPadding = parseFloat(getComputedStyle(allClassesInSlide[0]).getPropertyValue('padding-top'))
    let classBlockBottomPadding = parseFloat(getComputedStyle(allClassesInSlide[0]).getPropertyValue('padding-bottom'))
    let classBlockHeight = parseFloat(getComputedStyle(allClassesInSlide[0]).getPropertyValue('height'))
    let classBlockLength = classBlockTopPadding + classBlockHeight + classBlockBottomPadding
    let scrollTopPos = document.getElementById('left-inner-class-bar-wrapper').scrollTop

    let startingClassIdx = Math.max(0, parseInt(scrollTopPos / classBlockLength - 1))
    let endingClassIdx = parseInt((scrollTopPos + scrollViewHeight) / classBlockLength)

    let totalNumClassInSlide = allClassesInSlide.length
    
    prevClassesSynset.forEach(prevSynset => {
        dehighlightEmbeddingPoint(prevSynset, getCssVar('--highlight-scroll'))
    })

    prevClassesSynset = []

    for (var i = 0; i < totalNumClassInSlide; i++) {
        let shownClassSynset = allClassesInSlide[i].id.split('-')[2]
        prevClassesSynset.push(shownClassSynset)

        if (i >= startingClassIdx && i < endingClassIdx || i == 0){
            highlightEmbeddingPoint(shownClassSynset, getCssVar('--highlight-scroll'))
        } else {
            dehighlightEmbeddingPoint(shownClassSynset, getCssVar('--highlight-scroll'))
        }
    }

}   

function getCssVar(name) {
    return getComputedStyle(document.body).getPropertyValue(name)
}

function genSearchBar(data, accuracyBinMax) {
    // Get all class names
    let classNames = data.map(x => x.name.replace(/_/g, ' ').toLowerCase())
    
    // Generate search bar
    let leftSearchBar = document.getElementById('search')
    leftSearchBar.innerHTML = getSearchBarInnerHTML(classNames)

    // Create search list
    var comboplete = new Awesomplete('input.awesomplete', {minChars: 0,});        

    // Select item
    Awesomplete.$('.awesomplete').addEventListener("awesomplete-selectcomplete", function() {
        let searchbox = document.getElementById('searchbox')
        let selectedSearchLabel = searchbox.value
        updateSelectedSearch(data, selectedSearchLabel, accuracyBinMax)
    });
}

function getSearchBarInnerHTML(dataList) {
    let dataListStr = dataList.join(', ')
    let innerHtml = '<input '
    innerHtml += 'class="awesomplete" '
    innerHtml += 'placeholder="Class" '
    innerHtml += 'id="searchbox" '
    innerHtml += 'data-list="' + dataListStr + '" '
    innerHtml += '/>'
    return innerHtml
}

function updateSelectedSearch(data, selectedSearchLabel, accuracyBinMax) {
    let d = data.filter(x => selectedSearchLabel === x.name.replace(/_/g, ' ').toLowerCase())[0]
    selectedClass = d
    
    removeClassBars()
    document.getElementById('left-inner-class-bar-wrapper').scrollTop = 0;
    makeClassBars(data, layer, d, 'dis', accuracyBinMax)
    removeDagVIS()
    dagVIS(d)
    colorEmbeddingPointsInViewbox()
    highlightEmbeddingPointLabel(d.synset, getCssVar('--highlight-clicked'))

    selectedLabel = d.name
}

function updateSearchBarText() {
    let searchbox = document.getElementById('searchbox')
    searchbox.value = selectedLabel.replace(/_/g, ' ').toLowerCase()
}

function computeAccuracyMax(data) {

    let binMaxs = []

    data.forEach(c => {
        let tempAccuracyX = d3.scaleLinear()
            .domain(d3.extent(c.accs)).nice()
            .range([0, accuracyWidth])

        let bins = d3.histogram()
            .domain(tempAccuracyX.domain())
            .thresholds(tempAccuracyX.ticks(20))
            (c.accs)

        binMaxs.push(d3.max(bins, d => d.length))
        
    })

    return d3.max(binMaxs)
}