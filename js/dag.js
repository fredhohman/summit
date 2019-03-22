import * as d3 from "d3"
import { layerChannelCounts, layer } from './class-sidebar'
import { createGunzip } from "zlib";
import { createPrivateKey } from "crypto";

console.log(layerChannelCounts)
let rightInner = d3.select('#right-inner')

let rightInnerOptions = d3.select('#right-inner-options')

let rightInnerDagWrapper = d3.select('#right-inner-dag-wrapper')

// let layers = ['mixed5a', 'mixed4e', 'mixed4d', 'mixed4c', 'mixed4b', 'mixed4a', 'mixed3b', 'mixed3a']
// let layers = ['mixed5b', 'mixed5a', 'mixed4e']
// let layers = ['mixed5a', 'mixed4e']
let layers = Object.keys(layerChannelCounts).reverse()

const dagMargin = ({ top: 40, right: 40, bottom: 40, left: 40 })
const dagWidth = 1000 - dagMargin.left - dagMargin.right
const dagHeight = 800 - dagMargin.top - dagMargin.bottom // 790 based on laptop screen height
let k = 1; // dag zoom scale
let numTopAttr = 3;
const filterTransitionSpeed = 1000
const fv_type = '.jpg'

let zoom = d3.zoom()
    .scaleExtent([.05, 5])
    .extent([[0, 0], [dagWidth, dagHeight]])
    .on("zoom", zoomed);

function zoomed() {
    d3.select('#dagG').attr("transform", d3.event.transform);
    // console.log(d3.event.transform)
}

let dagSVG = rightInnerDagWrapper
    .append('svg')
    .attr('viewBox', '0 0 ' + (dagWidth + dagMargin.left + dagMargin.right) + ' ' + (dagHeight + dagMargin.top + dagMargin.bottom))
    .attr('width', '100%')
    .style('border-bottom', '1px solid black') // for debugging
    .attr('id', 'dag')
    // .call(zoom)

dagSVG.append('filter')
    .attr('id', 'grayscale')
    .append('feColorMatrix')
    .attr('type', 'matrix')
    .attr('values','0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0')

let zoomRect = dagSVG.append("rect")
    .attr("width", dagWidth + dagMargin.left + dagMargin.right)
    .attr("height", dagHeight + dagMargin.top + dagMargin.bottom)
    .style("fill", "none")
    .style("pointer-events", "all")
    // .attr('transform', 'translate(' + dagMargin.left + ',' + dagMargin.top + ')')
    .call(zoom);

let dagDefs = dagSVG.append('defs')

const fvWidth = 100
const fvHeight = fvWidth

const deWidth = 49
const deHeight = deWidth

const layerVerticalSpace = 300
const fvHorizontalSpace = 50

const layerIndex = {
    'mixed3a': 8,
    'mixed3b': 7,
    'mixed4a': 6,
    'mixed4b': 5,
    'mixed4c': 4,
    'mixed4d': 3,
    'mixed4e': 2,
    'mixed5a': 1,
    'mixed5b': 0
}

const indexLayer = {
    8: 'mixed3a',
    7: 'mixed3b',
    6: 'mixed4a',
    5: 'mixed4b',
    4: 'mixed4c',
    3: 'mixed4d',
    2: 'mixed4e',
    1: 'mixed5a',
    0: 'mixed5b'
}

let channelsHidden = new Set()

function newChannelClipPath(layer, channel) {
    dagDefs.append('clipPath')
        .attr('id', 'fv-clip-path-' + layer + '-' + channel.channel)
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', channel.width)
        .attr('height', channel.width)
        .attr('rx', 8)
        .attr('ry', 8)
}

dagDefs.append('clipPath')
    .attr('id', 'fv-clip-path')
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', fvWidth)
    .attr('height', fvHeight)
    .attr('rx', 8)
    .attr('ry', 8)

dagDefs.append('clipPath')
    .attr('id', 'de-clip-path')
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', deWidth)
    .attr('height', deHeight)
    .attr('rx', 4)
    .attr('ry', 4)

// class name
let rightInnerOptionsClassName = rightInnerOptions
    .append('div')
    .classed('right-inner-option-wrapper', true)
    // .style('padding-right', '20px')

rightInnerOptionsClassName
    .append('span')
    .classed("smalltext-header", true)
    .style('color', '#666666')
    .text('class')

let className = rightInnerOptionsClassName
    .append('div')
    .classed("header-value", true)
    .attr('id', 'selected-class-value')

// class number of instances
let rightInnerOptionsClassInstances = rightInnerOptions
    .append('div')
    .classed('right-inner-option-wrapper', true)
    // .style('padding-right', '20px')

rightInnerOptionsClassInstances
    .append('span')
    .classed("smalltext-header", true)
    .style('color', '#666666')
    .text('instances')

let classInstances = rightInnerOptionsClassInstances
    .append('div')
    .classed("header-value", true)

// class accuracy
let rightInnerOptionsClassAcc = rightInnerOptions
    .append('div')
    .classed('right-inner-option-wrapper', true)
    // .style('padding-right', '20px')

rightInnerOptionsClassAcc
    .append('span')
    .classed("smalltext-header", true)
    .style('color', '#666666')
    .text('accuracy')

let classAcc = rightInnerOptionsClassAcc
    .append('div')
    .classed("header-value", true)

// class accuracy histogram
let rightInnerOptionsClassAccHist = rightInnerOptions
    .append('div')
    .classed('right-inner-option-wrapper', true)

const accuracyMargin = { top: 7, right: 0, bottom: 2, left: 0 }
const accuracyWidth = 100 - accuracyMargin.left - accuracyMargin.right // 100 from flex-basis width of class-bar-text-accuracy
const accuracyHeight = 25 - accuracyMargin.top - accuracyMargin.bottom // 100 from flex-basis width of class-bar-text-accuracy

rightInnerOptionsClassAccHist
    .append('svg')
    .attr("width", accuracyWidth + accuracyMargin.left + accuracyMargin.right)
    .attr("height", accuracyHeight + accuracyMargin.top + accuracyMargin.bottom)
    .attr('id', 'accuracy-hist')

// home zoom button
rightInnerOptions
    .append('div')
    .classed('right-inner-option-wrapper', true)
    .append('button')
    .attr('type', 'button')
    .classed('square-button', true)
    .append('i')
    .classed('material-icons', true)
    .classed('md-24', true)
    .text('home')
    .attr('id', 'dag-home')

// channel count slider
let rightInnerOptionsFilter = rightInnerOptions
    .append('div')
    .classed('right-inner-option-wrapper', true)

rightInnerOptionsFilter.append('span')
    .classed("smalltext-header", true)
    .style('color', '#666666')
    .text('filter graph')

rightInnerOptionsFilter
    .append('div')
    .classed('header-value', true)
    .append('input')
    .attr('type', 'range')
    .attr('id', 'dag-channel-count-filter-slider')
    .attr('min', 0)
    .attr('max', 1300)
    .attr('value', 0)
    .classed('slider', true)

export function dagVIS(selectedClass) {
    console.log('dagVIS', selectedClass)
    
    // d3.json('./data/dag/dag-270.json').then(function (dag) {
    d3.json('./data/dag/dag-270-unified.json').then(function (dag) {
    // d3.json('./data/dag/dag-' + selectedClass['target_class'] + '.json').then(function (dag) {
    // d3.json('./data/dag/dag-' + selectedClass['target_class'] + '-unified.json').then(function (dag) {
        console.log(dag);

        let tempMins = []
        let tempMaxs = []
        let tempCountMaxs = []
        layers.forEach(layer => {
            let tempExtent = d3.extent(dag[layer], d => {
                return d.pagerank
            })
            tempMins.push(tempExtent[0])
            tempMaxs.push(tempExtent[1])
            tempCountMaxs.push(d3.max(dag[layer], d => { return d.count }))
        })

        const fvScaleMax = d3.max(tempMaxs)
        const fvScaleMin = d3.min(tempMins)
        const cvScaleCountMax = d3.max(tempCountMaxs)

        let countMax = d3.max(dag)

        let fvScale = d3.scaleLinear()
            .domain([0, cvScaleCountMax]) // max = 1300 for all class comparison
            .range([fvWidth/3, fvWidth])

        let dagG = dagSVG
            .append("g")
            .attr("transform", "translate(" + dagMargin.left + "," + dagMargin.top + ")")
            .attr('id', 'dagG')

        d3.select('#dag-channel-count-filter-slider')
            .attr('max', cvScaleCountMax)

        function drawOrigin(){
            dagG.append('circle')
                .attr('r', 10)
                .attr('cx', 0)
                .attr('cy', 0)
        }
        drawOrigin()

        function centerDag() {
            zoomRect.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(dagWidth / 2, 50).scale(0.26));
        }
        centerDag()
        d3.select('#dag-home').on('click', () => {
            centerDag()
        })

        function computeChannelCoordinates(layer) {
            
            let i = 0
            dag[layer].forEach(ch => {
                ch.width = fvScale(ch.count)
                ch.x = (((fvWidth + fvHorizontalSpace) * i) - ((dag[layer].length * fvWidth + (dag[layer].length - 1) * fvHorizontalSpace) / 2)) + (fvWidth - ch.width) / 2
                ch.y = layerIndex[layer] * layerVerticalSpace + (fvWidth - ch.width) / 2
                i = i + 1
            });

        }

        function computeChannelCoordinatesFilter(layer, filterValue) {

            let i = 0
            let dagFiltered = dag[layer].filter(function (ch) {
                return ch.count > filterValue
            })

            let currLayerLength = dagFiltered.length

            dag[layer].forEach(ch => {
                if (ch.count > filterValue) {
                    ch.x = (((fvWidth + fvHorizontalSpace) * i) - ((currLayerLength * fvWidth + (currLayerLength - 1) * fvHorizontalSpace) / 2)) + (fvWidth - ch.width) / 2
                    // ch.x = (((fvWidth + fvHorizontalSpace) * i) - ((currLayerLength * fvWidth + (currLayerLength - 1) * fvHorizontalSpace) / 2))
                    ch.y = layerIndex[layer] * layerVerticalSpace + (fvWidth - ch.width) / 2
                    i = i + 1
                } else {
                    ch.x = 0 - fvWidth/2
                }
            });

        }

        function initializeChannelEdgeCount(layer) {

            dag[layer].forEach(ch => {
                ch.numOfEdgesIn = 0
                ch.numOfEdgesOut = 3
            });

        }

        function drawExamplesForLayer(layer) {
            for (let ch = 0; ch < dag[layer].length; ch++) {
                for (let i = 0; i < 10; i++) {
                    drawDatasetExamples(layer, dag[layer][ch], i)
                }   
            }
        }

        function drawDatasetExamples(layer, channel, index) {
            dagG.append('image')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', deWidth)
                .attr('height', deHeight)
                .attr('xlink:href', '../data/feature-vis/dataset-p/' + layer + '-' + channel.channel + '-' + 'dataset-p-' + index + fv_type)
                .classed('fv-de', true)
                // .attr('clip-path', 'url(#de-clip-path)')
                // .attr("transform", "translate(" + channel.x + ", " + (channel.y + fvHeight / 4) + ")") // hidden in middle of channel, left
                // .attr("transform", "translate(" + (channel.x + fvWidth / 4) + ", " + (channel.y + fvHeight / 4) + ")") // hidden in middle of channel, center
                // .attr("transform", () => { // above channel
                //     if (index < 5) {
                //         return "translate(" + (channel.x + index * deWidth + (index + 1) * 2) + ", " + (channel.y - deHeight - 1) + ")"
                //     } else if (index >= 5) {
                //         return "translate(" + (channel.x + (index - 5) * deWidth + (index - 5 + 1) * 2) + ", " + (channel.y - 2 * (deHeight + 1)) + ")"
                //     }
                // })
                .attr("transform", () => { // centered up top
                    if (index < 5) {
                        return "translate(" + ((channel.x + index * deWidth) + (index + 1) * 2 - (fvWidth - channel.width) / 2 - deWidth * 1.5 - 1.5 * 2) + ", " + (channel.y - deHeight - 1 - 15) + ")" // -15 to raise above label
                    } else if (index >= 5) {
                        return "translate(" + ((channel.x + (index-5) * deWidth) + (index -5 + 1) * 2 - (fvWidth - channel.width) / 2 - deWidth * 1.5 - 1.5 * 2) + ", " + (channel.y - 2 * (deHeight + 1) - 15) + ")"
                    }
                })
                .style('opacity', 0)
                .style('display', 'none')
                .attr('id', layer + '-' + channel.channel + '-' + 'dataset-p-' + index)
                .classed(layer + '-' + channel.channel + '-' + 'dataset-p', true)
        }

        function makeChannelClipPaths() {
            layers.forEach(layer =>{
                dag[layer].forEach(channel =>{
                    newChannelClipPath(layer, channel)
                })
            })
        }

        function drawChannels(layer) {

            dagG.selectAll('.fv-ch-' + layer)
                .data(dag[layer])
                .enter()
                .append('image')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', d => fvScale(d.count))
                .attr('height', d => fvScale(d.count))
                // .attr('width', d => fvWidth)
                // .attr('height', d => fvHeight)
                .attr('xlink:href', d => '../data/feature-vis/channel/' + layer + '-' + d.channel + '-channel' + fv_type)
                // .attr('clip-path', 'url(#fv-clip-path)')
                .attr('clip-path', d => 'url(#fv-clip-path-' + layer + '-' + d.channel + ')')
                // .attr("transform", (d, i) => "translate(" + 
                //     // x: feature vis width and feature vis spacing * i, then subtract total feature vis and horizontal space to center
                //     (((fvWidth + fvHorizontalSpace) * i) - ((dag[layer].length * fvWidth + (dag[layer].length-1) * fvHorizontalSpace) / 2)) + "," +
                //     layerIndex[layer] * layerVerticalSpace  + " )"
                // )
                .attr("transform", (d, i) => "translate(" +
                    d.x + ',' +
                    d.y + " )"
                )
                .attr('id', d => layer + '-' + d.channel + '-channel')
                .classed('fv-ch', true)
                .classed('fv-ch-' + layer, true)
                .on('mouseover', function() {
                    d3.selectAll('.fv-ch').attr('filter', 'url(#grayscale)')
                    d3.select(this).attr('filter', null)

                    let curr_channel = d3.select(this).data()[0]

                    // hard coded below! expand to the right
                    d3.selectAll('.' + layer + '-' + curr_channel.channel + '-dataset-p')
                        // .transition()
                        // .duration(750)
                        .style('display', 'block')
                        .style('opacity', 1)
                        // .attr("transform", (d,i) => { // centered up top
                        //     if (i < 5) {
                        //         return "translate(" + ((curr_channel.x + i * deWidth + (i + 1) * 2) - deWidth * 1.5 - 1.5 * 2) + ", " + (curr_channel.y - deHeight - 1) + ")"
                        //     } else if (i >= 5) {
                        //         return "translate(" + ((curr_channel.x + (i - 5) * deWidth + (i - 5 + 1) * 2) - deWidth * 1.5 - 1.5 * 2) + ", " + (curr_channel.y - 2 * (deHeight + 1)) + ")"
                        //     }
                        // })
                        // .attr("transform", (d, i) => { // centered starting at left corner
                        //     if (i < 5) {
                        //         return "translate(" + (curr_channel.x + i * deWidth + (i + 1) * 2) + ", " + (curr_channel.y - deHeight - 1) + ")"
                        //     } else if (i >= 5) {
                        //         return "translate(" + (curr_channel.x + (i-5) * deWidth + (i - 5 + 1) * 2) + ", " + (curr_channel.y - 2*(deHeight + 1)) + ")"
                        //     }
                        // })
                    
                    d3.selectAll('.dag-edge-' + layer + '-' + curr_channel.channel + '-in')
                        .classed('dag-edge-animate-in', true)

                    d3.selectAll('.dag-edge-' + layer + '-' + curr_channel.channel + '-out')
                        .classed('dag-edge-animate-out', true)

                    d3.selectAll('.fv-ch-' + indexLayer[layerIndex[layer] - 1])
                        .filter(d => {
                            let tempPrevChannels = d['prev_channels'].map(pv => pv['prev_channel'])
                            if (tempPrevChannels.includes(curr_channel.channel)) {
                                return d    
                            }
                        })
                        .attr('filter', null)

                    curr_channel['prev_channels'].forEach(pc => {
                        d3.selectAll('#' + indexLayer[layerIndex[layer] + 1] + '-' + pc['prev_channel'] + '-channel')
                            .attr('filter', null) 
                    });
                })
                .on('mousemove', function(d) {
                    // diversity hovering
                    let coordinates = d3.mouse(this)
                    let mouseX = coordinates[0]
                    let mouseY = coordinates[1]
                    let channelSelection = d3.select(this)
                    // console.log(mouseX, mouseY, channelSelection)

                    let diversity;
                    if (mouseX < d.width/4) {
                        diversity = 0
                    } else if ((mouseX > d.width * (1 / 4)) && (mouseX < d.width * (1 / 2))) {
                        diversity = 1
                    } else if ((mouseX > d.width * (1 / 2)) && (mouseX < d.width * (3 / 4))) {
                        diversity = 2
                    } else if (mouseX > d.width * (3 / 4)) {
                        diversity = 3
                    }

                    channelSelection.attr('xlink:href', '../data/feature-vis/diversity-' + diversity+ '/' + d.layer + '-' + d.channel + '-diversity-' + diversity + fv_type)

                })
                .on('mouseout', function(d) {

                    let channelSelection = d3.select(this)

                    d3.selectAll('.fv-ch').attr('filter', null)

                    d3.selectAll('.' + layer + '-' + d.channel + '-dataset-p')
                        // .transition()
                        // .duration(750)
                        // .attr("transform", (d, i) => {
                            // return "translate(" + curr_channel.x + ", " + (curr_channel.y + fvHeight / 4)  + ")" // center left
                            // return "translate(" + (curr_channel.x+fvWidth/4) + ", " + (curr_channel.y + fvHeight / 4) + ")"
                        // })
                        .style('opacity', 0)
                        .style('display', 'none')

                    d3.selectAll('.dag-edge-' + layer + '-' + d.channel + '-in')
                        .classed('dag-edge-animate-in', false)
                    
                    d3.selectAll('.dag-edge-' + layer + '-' + d.channel + '-out')
                        .classed('dag-edge-animate-out', false)

                    channelSelection.attr('xlink:href', d => '../data/feature-vis/channel/' + layer + '-' + d.channel + '-channel' + fv_type)

                })
                .on('click', function (d) {
                    // XXXXX
                    console.log('click image', d.channel)
                    
                    let attrChannels;
                    let clickedChannelIdx = 0;
                    dag[layer].forEach(channelInfo => {
                        if (channelInfo.channel === d.channel) {
                            attrChannels = channelInfo['attr_channels']
                            return false
                        }
                        clickedChannelIdx = clickedChannelIdx + 1
                    })
                    console.log(attrChannels)
                    
                    let prevLayer = indexLayer[layerIndex[layer] + 1]
                    attrChannels.forEach(attrChannel => {
                        let isNew = true
                        dag[prevLayer].forEach(prevChannel => {
                            if (prevChannel.channel === parseInt(attrChannel.prev_channel)) {
                                isNew = false
                                return false;
                            }
                        })
                        if (isNew) {
                            console.log(attrChannel.prev_channel, 'is added')
                            dag[prevLayer].push({
                                'attr_channels': [],
                                'channel': parseInt(attrChannel.prev_channel),
                                'count': 50, // XXXXX min()
                                'layer': prevLayer,
                                'pagerank': 0.0005, // XXXXX min()
                                'prev_channels': [],
                                'width': 38, // XXXX
                                'x': -200, // XXXX
                                'y': 2100 // XXXX
                            })   
                        }
                    })

                    // computeChannelCoordinates(prevLayer)

                    let i = 0
                    dag[prevLayer].forEach(ch => {
                        console.log('ch:', ch.channel, ', dag[prevlayer].len:', dag[prevLayer].length)
                        ch.width = fvScale(ch.count)
                        ch.x = (((fvWidth + fvHorizontalSpace) * i) - ((dag[prevLayer].length * fvWidth + (dag[prevLayer].length - 1) * fvHorizontalSpace) / 2)) + (fvWidth - ch.width) / 2
                        ch.y = layerIndex[prevLayer] * layerVerticalSpace + (fvWidth - ch.width) / 2
                        i = i + 1
                    });
                    
                    dagG.selectAll('.fv-ch-' + prevLayer)
                        .data(dag[prevLayer])
                        .enter()
                        .append('image')
                        .attr('x', 0)
                        .attr('y', 0)
                        .attr('width', d => fvScale(d.count))
                        .attr('height', d => fvScale(d.count))
                        .attr('width', d => fvWidth)
                        .attr('xlink:href', d => '../data/feature-vis/channel/' + prevLayer + '-' + d.channel + '-channel' + fv_type)
                        .attr('clip-path', d => 'url(#fv-clip-path-' + prevLayer + '-' + d.channel + ')')
                        .attr("transform", (d, i) => "translate(" + d.x + ',' + d.y + " )")
                        .attr('id', d => prevLayer + '-' + d.channel + '-channel')

                    updateChannels()
                    updateChannelLabels()
                    updateEdges()
                    updateDatasetExamples()
                    d3.select('#dag-layer-label-' + prevLayer)
                        .transition()
                        .duration(filterTransitionSpeed)
                        .attr('transform', d => 'translate(' + (0 - (fvWidth / 4 + ((dag[prevLayer].length * fvWidth + (dag[prevLayer].length - 1) * fvHorizontalSpace) / 2))) + ',' + (layerIndex[d] * layerVerticalSpace + fvHeight / 2) + ')')
                })

            dagG.selectAll('.fv-ch-label-' + layer)
                .data(dag[layer])
                .enter()
                .append('text')
                .attr('x', d => d.x)
                .attr('y', d => d.y - 3)
                .text(d => d.channel)
                .classed('fv-ch-label', true)
                .classed('fv-ch-label-' + layer, true)
                .attr('id', d => 'fv-ch-label-' + layer + '-' + d.channel)

        }

        
        function drawLayerLabels() {
            dagG.selectAll('.dag-layer-label')
                .data(layers)
                .enter()    
                .append('text')
                // .attr('x', d => 0 - ((dag[d].length * fvWidth + (dag[d].length - 1) * fvHorizontalSpace) / 2))
                // .attr('y', (d, i) => layerIndex[d] * layerVerticalSpace)
                .text(d => d)
                .attr('transform', d => 'translate(' + (0 - (fvWidth/4 + ((dag[d].length * fvWidth + (dag[d].length - 1) * fvHorizontalSpace) / 2))) + ',' + (layerIndex[d] * layerVerticalSpace + fvHeight/2) + ')')
                .attr('text-anchor', 'end')
                .classed('dag-layer-label', true)
                .attr('id', d => 'dag-layer-label-' + d)

        }
        let edgeScale = d3.scaleLinear()
            .domain([0, 1300]) // check this, do d3.max instead? OR 1300
            .range([0, 6])

        function drawEdgesPerLayer(layer, channel) {

            // update dag data with edge count
            let layerToUpdate = indexLayer[layerIndex[layer] + 1]
            channel['prev_channels'].forEach(prevChannel => {
                let channelToUpdate = dag[layerToUpdate].find(function (element) {
                    return element.channel === prevChannel['prev_channel'];
                });

                channelToUpdate.numOfEdgesIn += 1
            })
        
            dagG.selectAll('.dag-edge-temp-' + layer) // need the throwaway class since we do this for every channel and use multiple classes
                .data(channel['prev_channels'])
                .enter()
                .append('path')
                .attr('d', d => {
                    let layerToConnectTo = indexLayer[layerIndex[layer] + 1]
                    let channelToConnectTo = dag[layerToConnectTo].find(function (element) {
                        return element.channel === d['prev_channel'];
                    });

                    // return "M" + (channel.x + fvWidth / 2) + "," + (channel.y + fvHeight)
                    //     + "C" + (channel.x + fvWidth / 2) + " " + (channel.y + fvHeight
                    //         + layerVerticalSpace/2) + "," + (channelToConnectTo.x + fvWidth/2) + " "
                    //         + (channelToConnectTo.y - layerVerticalSpace / 2) + ","
                    //         + (channelToConnectTo.x + fvWidth/2) + " " + channelToConnectTo.y

                    return "M" + (channel.x + channel.width / 2) + "," + (channel.y + fvHeight - (fvHeight - channel.width))
                        + "C" + (channel.x + channel.width / 2) + " " + (channel.y + fvHeight - (fvHeight - channel.width)
                            + layerVerticalSpace / 2) + "," + (channelToConnectTo.x + channelToConnectTo.width / 2) + " "
                        + (channelToConnectTo.y - layerVerticalSpace / 2 - (fvHeight - channelToConnectTo.width)) + ","
                        + (channelToConnectTo.x + channelToConnectTo.width / 2) + " " + channelToConnectTo.y
                })
                .style('stroke-width', d => edgeScale(d.inf))
                // .classed('dag-edge', true)
                // .classed('dag-edge-' + layer, true)
                // .classed('dag-edge-' + layer + '-' + channel.channel + '-out', true)
                // .classed(d => {
                //     return 'dag-edge-' + layer + '-' + d['prev_channel'] + '-in'
                // })
                .attr('class', d => {

                    let classString = 'dag-edge' +
                        ' ' + 'dag-edge-' + layer +
                        ' ' + 'dag-edge-' + layer + '-' + channel.channel +
                        ' ' + 'dag-edge-' + indexLayer[layerIndex[layer] + 1] + '-' + d['prev_channel'] +
                        ' ' + 'dag-edge-' + layer + '-' + channel.channel + '-out'

                        if (d.layer != 'mixed5b') {
                            classString += ' ' + 'dag-edge-' + indexLayer[layerIndex[layer] + 1] + '-' + d['prev_channel'] + '-in'
                            
                        }

                    return classString
                        
                        // ' ' + 'dag-edge-' + indexLayer[layerIndex[layer] + 1] + '-' + d['prev_channel'] + '-in'
                        // ' ' + 'dag-edge-' + layer + '-' + channel.channel + '-in'
                })
                .attr('id', d => {
                    let layerToConnectTo = indexLayer[layerIndex[layer] + 1]
                    let channelToConnectTo = dag[layerToConnectTo].find(function (element) {
                        return element.channel === d['prev_channel'];
                    });
                    return 'dag-edge-' + layer + '-' + channel.channel + '-' + layerToConnectTo + '-' + channelToConnectTo.channel
                })
                .on('mouseover', function() {
                    let edgeID = d3.select(this).attr('id').split('-')
                    let topLayer = edgeID[2]
                    let topChannel = edgeID[3]
                    let bottomLayer = edgeID[4]
                    let bottomChannel = edgeID[5]

                    d3.selectAll('.fv-ch').attr('filter', 'url(#grayscale)')
                    d3.select('#' + topLayer + '-' + topChannel + '-channel').attr('filter', null)
                    d3.select('#' + bottomLayer + '-' + bottomChannel + '-channel').attr('filter', null)

                    d3.selectAll('.' + topLayer + '-' + topChannel + '-dataset-p')
                        .style('display', 'block')
                        .style('opacity', 1)

                    d3.selectAll('.' + bottomLayer + '-' + bottomChannel + '-dataset-p')
                        .style('display', 'block')
                        .style('opacity', 1)

                })
                .on('mouseout', function () {
                    d3.selectAll('.fv-ch').attr('filter', null)

                    d3.selectAll('.fv-de')
                        .style('display', 'none')
                        .style('opacity', 0)
                })
        }

        function drawEdges() {
            layers.forEach(l => {
                console.log(l)
                if (l !== layers[layers.length - 1]) { // don't draw edges from the last layer downward
                console.log('draw edges for ', l)
                    dag[l].forEach(ch => {
                        drawEdgesPerLayer(l, ch)
                    });
                }
            });
        }

        function updateChannels() {
            d3.selectAll('.fv-ch')
                .transition()
                .duration(filterTransitionSpeed)
                .attr("transform", (d, i) => "translate(" +
                    d.x + ',' +
                    d.y + " )"
                )
        }

        function updateChannelLabels(){
            layers.forEach(layer => {
                dagG.selectAll('.fv-ch-label-' + layer)
                    .transition()
                    .duration(filterTransitionSpeed)
                    .attr('x', d => d.x)
                    .attr('y', d => d.y - 3)
            })
        }

        function updateLayerLabels(filterValue) {
            layers.forEach(layer =>{
                let dagFiltered = dag[layer].filter(function (ch) {
                    return ch.count > filterValue
                })

                let currLayerLength = dagFiltered.length

                d3.select('#dag-layer-label-' + layer)
                    .transition()
                    .duration(filterTransitionSpeed)
                    .attr('transform', d => 'translate(' + (0 - (fvWidth / 4 + ((currLayerLength * fvWidth + (currLayerLength - 1) * fvHorizontalSpace) / 2))) + ',' + (layerIndex[d] * layerVerticalSpace + fvHeight / 2) + ')')

            })
        }

        function updateDatasetExamples() {
            layers.forEach(layer =>{
                for (let channel = 0; channel < dag[layer].length; channel++) {
                    for (let index = 0; index < 10; index++) {

                        d3.select('#' + layer + '-' + dag[layer][channel].channel + '-' + 'dataset-p-' + index)
                            .attr("transform", () => { // centered up top
                                if (index < 5) {
                                    return "translate(" + ((dag[layer][channel].x + index * deWidth) + (index + 1) * 2 - (fvWidth - dag[layer][channel].width) / 2 - deWidth * 1.5 - 1.5 * 2) + ", " + (dag[layer][channel].y - deHeight - 1 - 15) + ")"
                                } else if (index >= 5) {
                                    return "translate(" + ((dag[layer][channel].x + (index - 5) * deWidth) + (index - 5 + 1) * 2 - (fvWidth - dag[layer][channel].width) / 2 - deWidth * 1.5 - 1.5 * 2) + ", " + (dag[layer][channel].y - 2 * (deHeight + 1) - 15) + ")"
                                }
                            })
                            // .attr("transform", () => { // centered up top
                            //     if (index < 5) {
                            //         return "translate(" + ((dag[layer][channel].x + index * deWidth + (index + 1) * 2) - deWidth * 1.5 - 1.5 * 2) + ", " + (dag[layer][channel].y - deHeight - 1) + ")"
                            //     } else if (index >= 5) {
                            //         return "translate(" + ((dag[layer][channel].x + (index - 5) * deWidth + (index - 5 + 1) * 2) - deWidth * 1.5 - 1.5 * 2) + ", " + (dag[layer][channel].y - 2 * (deHeight + 1)) + ")"
                            //     }
                            // })

                    }
                }
            })
        }

        function updateEdges() {
            layers.forEach(l => {

                // console.log(l)
                if (l !== layers[layers.length - 1]) { // don't draw edges from the last layer downward
                    // console.log('draw edges for ', l)

                    dag[l].forEach(channel => {

                        d3.selectAll('.dag-edge-' + l + '-' + channel.channel + '-out')
                            .transition()
                            .duration(filterTransitionSpeed)
                            .attr('d', d => {

                                let layerToConnectTo = indexLayer[layerIndex[l] + 1]
                                let channelToConnectTo = dag[layerToConnectTo].find(function (element) {
                                    return element.channel === d['prev_channel'];
                                });

                                // return "M" + (ch.x + fvWidth / 2) + "," + (ch.y + fvHeight)
                                //     + "C" + (ch.x + fvWidth / 2) + " " + (ch.y + fvHeight
                                //         + layerVerticalSpace / 2) + "," + (channelToConnectTo.x + fvWidth / 2) + " "
                                //     + (channelToConnectTo.y - layerVerticalSpace / 2) + ","
                                //     + (channelToConnectTo.x + fvWidth / 2) + " " + channelToConnectTo.y

                                return "M" + (channel.x + channel.width / 2) + "," + (channel.y + fvHeight - (fvHeight - channel.width))
                                    + "C" + (channel.x + channel.width / 2) + " " + (channel.y + fvHeight - (fvHeight - channel.width)
                                    + layerVerticalSpace / 2) + "," + (channelToConnectTo.x + channelToConnectTo.width / 2) + " "
                                    + (channelToConnectTo.y - layerVerticalSpace / 2 - (fvHeight - channelToConnectTo.width)) + ","
                                    + (channelToConnectTo.x + channelToConnectTo.width / 2) + " " + channelToConnectTo.y

                            })
                    });
                }
            });
        }

        function drawDAG() {

            className
                .text(selectedClass.name)
            classInstances
                .text(selectedClass.numOfInstances)
            classAcc
                .text((100 * selectedClass.topOneAcc).toFixed(1) + '%')

            let accHistFromClassBar = document.getElementById("accuracy-" + selectedClass.synset);
            console.log(accHistFromClassBar)
            let accHistFromClassBarCopy = accHistFromClassBar.cloneNode(true);
            document.getElementById('accuracy-hist')
                .appendChild(accHistFromClassBarCopy)

            let maxNumEdgesIn = []
            layers.forEach(l => {
                console.log('compute layer ', l)
                computeChannelCoordinates(l)
                initializeChannelEdgeCount(l)
            });

            makeChannelClipPaths()
            drawEdges()

            layers.forEach(l => {

                let temp = d3.max(dag[l], d => {
                    return d.numOfEdgesIn
                })
                maxNumEdgesIn.push(temp)

                drawExamplesForLayer(l)
                drawChannels(l)
            });
            
            drawLayerLabels()

            d3.select('#dag-channel-count-filter-slider')
                .on('input', function () {

                    let filterValue = this.value

                    d3.selectAll('.fv-ch')
                        .attr('display', d => {

                            if (d.count > filterValue) {
                                channelsHidden.delete(d.layer + '-' + d.channel)

                                d3.select('#fv-ch-label-' + d.layer + '-' + d.channel)
                                    .attr('display', 'block')

                                return 'block'
                            } else {
                                channelsHidden.add(d.layer + '-' + d.channel)

                                d3.select('#fv-ch-label-' + d.layer + '-' + d.channel)
                                    .attr('display', 'none')

                                return 'none'
                            }
                        }
                    )

                    // move fv and edges on filter change
                    layers.forEach(l => {
                        computeChannelCoordinatesFilter(l, filterValue)
                    });
                        
                    d3.selectAll('.dag-edge').attr('display', 'block')
                    channelsHidden.forEach(ch => {
                        d3.selectAll('.dag-edge-' + ch)
                            .attr('display', 'none')
                    })

                    updateChannels()
                    updateChannelLabels()
                    updateLayerLabels(filterValue)
                    updateEdges()
                    updateDatasetExamples()

                })
                .property('value', 0)

        }

        drawDAG()

    })

}

export function removeDagVIS() {
    d3.select("#dagG").remove()
    d3.selectAll("#dag defs > clipPath").remove()
    d3.select("#accuracy-hist > *").remove()
}
