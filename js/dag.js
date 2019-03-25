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
let isAlreadyClicked = {}

const dagMargin = ({ top: 40, right: 40, bottom: 40, left: 40 })
const dagWidth = 1000 - dagMargin.left - dagMargin.right
const dagHeight = 800 - dagMargin.top - dagMargin.bottom // 790 based on laptop screen height
let k = 1; // dag zoom scale
let numTopAttr = 3;
const filterTransitionSpeed = 1000
const fv_type = '.jpg'
const exLayout = ({ offset: 10, top: 3, bottom: 3, right: 2, left: 2, TBPadding: 2})
const exRectLayout = ({ offset: 13, right: 2, left: 2})
const attrLayout = ({ topOffset: 60, top: 15, left: 3, right: 3, bottom: 3 })

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
    .attr('values', '0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0')

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

const attrFvWidth = 60
const attrFvHeight = attrFvWidth

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

dagDefs.append('clipPath')
    .attr('id', 'attr-fv-clip-path')
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', attrFvWidth)
    .attr('height', attrFvHeight)
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
    // d3.json('./data/dag/dag-270-unified.json').then(function (dag) {
        // d3.json('./data/dag/dag-' + selectedClass['target_class'] + '.json').then(function (dag) {
        d3.json('./data/dag/dag-' + selectedClass['target_class'] + '-unified.json').then(function (dag) {
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
            .range([fvWidth / 3, fvWidth])

        let dagG = dagSVG
            .append("g")
            .attr("transform", "translate(" + dagMargin.left + "," + dagMargin.top + ")")
            .attr('id', 'dagG')

        d3.select('#dag-channel-count-filter-slider')
            .attr('max', cvScaleCountMax)

        function drawOrigin() {
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
                    ch.x = 0 - fvWidth / 2
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
            // Padding and offset
            let rightPadding = exLayout.right
            let topPadding = exLayout.top
            let bottomPadding = exLayout.bottom

            for (let ch = 0; ch < dag[layer].length; ch++) {
                // Draw background rectangle
                let channel = dag[layer][ch]
                let rectId = layer + '-' + channel.channel + '-ex-rect'
                let x = getExRectX(channel)
                let y = getExRectY(channel)
                let width = (deWidth + rightPadding) * 5 + rightPadding
                let height = deHeight * 2 + topPadding + bottomPadding
                drawBackgroundRect(rectId, x, y, width, height, false)

                // Draw dataset examples
                for (let i = 0; i < 10; i++) {
                    drawDatasetExamples(layer, channel, i)
                }
            }
        }

        function getExRectX(channel) {
            let StartPadding = exRectLayout.left
            let rightOffset = exLayout.offset - StartPadding
            return channel.x + channel.width + rightOffset
        }

        function getExRectY(channel) {
            let topPadding = exLayout.top
            return channel.y + (channel.width / 2) - (fvHeight / 2) - topPadding
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
                .attr('transform', rightTranslation(channel.x, channel.y, channel.width, index))
                // .attr('transform', leftTranslation(channel.x, channel.y, channel.width, index))
                // .attr("transform", aboveTranslation(x, y, index))
                // .attr('transform', topCenteredTranslation(channel.x, channel.y, channel.width, index))
                // .style('opacity', 0)
                // .style('display', 'none')
                .attr('id', layer + '-' + channel.channel + '-dataset-p-' + index)
                .style('visibility', 'hidden')
                .classed(layer + '-' + channel.channel + '-dataset-p', true)
        }

        function rightTranslation(x, y, sz, index) {
            let rightOffset = exLayout.offset
            let rightPadding = exLayout.right
            let topBottomPadding = exLayout.TBPadding
            if (index < 5) {
                let dataExX = (x + sz + rightOffset) + index * (deWidth + rightPadding)
                let dataExY = y + (sz / 2) - deHeight - topBottomPadding
                return "translate(" + dataExX + ", " + dataExY + ")"
            } else if (index >= 5) {
                let dataExX = (x + sz + rightOffset) + (index - 5) * (deWidth + rightPadding)
                let dataExY = y + (sz / 2)
                return "translate(" + dataExX + ", " + dataExY + ")"
            }
        }

        function leftTranslation(x, y, sz, index) {
            let leftOffset = exLayout.offset
            let leftPadding = exLayout.left
            let topBottomPadding = exLayout.TBPadding

            if (index < 5) {
                let dataExX = (x - leftOffset - deWidth) - index * (deWidth + leftPadding)
                let dataExY = y + (sz / 2) - deHeight - topBottomPadding
                return "translate(" + dataExX + ", " + dataExY + ")"
            } else if (index >= 5) {
                let dataExX = (x - leftOffset - deWidth) - (index - 5) * (deWidth + leftPadding)
                let dataExY = y + (sz / 2)
                return "translate(" + dataExX + ", " + dataExY + ")"
            }

        }

        function aboveTranslation(x, y, index) {
            if (index < 5) {
                let dataExX = x + index * deWidth + (index + 1) * 2
                let DataExY = y - deHeight - 1
                return "translate(" + dataExX + ", " + DataExY + ")"
            } else if (index >= 5) {
                let dataExX = x + (index - 5) * deWidth + (index - 5 + 1) * 2
                let dataExY = y - 2 * (deHeight + 1)
                return "translate(" + dataExX + ", " + dataExY + ")"
            }
        }

        function topCenteredTranslation(x, y, sz, index) {
            if (index < 5) {
                let dataExX = (x + index * deWidth) + (index + 1) * 2 - (fvWidth - sz) / 2 - deWidth * 1.5 - 1.5 * 2
                let dataExY = y - deHeight - 1 - 15
                return "translate(" + dataExX + ", " + dataExY + ")"
            } else if (index >= 5) {
                let dataExX = (x + (index - 5) * deWidth) + (index - 5 + 1) * 2 - (fvWidth - sz) / 2 - deWidth * 1.5 - 1.5 * 2
                let dataExY = y - 2 * (deHeight + 1) - 15
                return "translate(" + dataExX + ", " + dataExY + ")"
            }
        }

        function makeChannelClipPaths() {
            layers.forEach(layer => {
                dag[layer].forEach(channel => {
                    newChannelClipPath(layer, channel)
                })
            })
        }

        function drawBackgroundRect(attrRectId, x, y, width, height, initVisible = true) {
            dagG.append('rect')
                .attr('x', x)
                .attr('y', y)
                .attr('width', width)
                .attr('height', height)
                .attr('fill', 'white')
                .attr('stroke', 'black')
                .style('visibility', initVisible ? 'visible' : 'hidden')
                .attr('id', attrRectId)
        }

        function drawAttrRects(layer, channel) {
            // Ignore mixed3a
            if (layer === 'mixed3a')
                return

            // Get previous layer
            let prevLayer = indexLayer[layerIndex[layer] + 1]

            // Get minimum count of the previous layer
            let prevCounts = dag[prevLayer].map(ch => ch.count)
            let minCounts = d3.min(prevCounts)

            // Offset and padding
            let attrLeftPadding = attrLayout.right
            let rectTopOffset = attrLayout.top
            let rectPaddingBottom = attrLayout.bottom
            let unitAttrImgSize = fvScale(minCounts)

            // Arguments for drawing background rect
            let x = getAttrRectX(layer, channel)
            let y = getAttrRectY(channel)
            let width = (attrFvWidth + attrLeftPadding) * 3 + attrLeftPadding
            let height = attrFvHeight + rectTopOffset + rectPaddingBottom

            // Draw background white rect
            let attrRectId = layer + '-' + channel.channel + '-attr-rect'
            drawBackgroundRect(attrRectId, x, y, width, height, false)
        }

        function drawAttrRectsLayer(layer) {
            dag[layer].forEach(channel => {
                drawAttrRects(layer, channel)
            })
        }

        function getAttrRectX(layer, channel) {
            // Get previous layer
            let prevLayer = indexLayer[layerIndex[layer] + 1]

            // Get minimum count of the previous layer
            let prevCounts = dag[prevLayer].map(ch => ch.count)
            let minCounts = d3.min(prevCounts)

            // Offset and padding
            let attrLeftOffset = attrLayout.left
            let attrLeftPadding = attrLayout.right
            let unitAttrImgSize = fvScale(minCounts)

            return channel.x - (attrFvWidth + attrLeftPadding) * 3 - attrLeftOffset * 2
        }

        function getAttrRectY(channel) {
            // Offset and padding
            let attrTopOffset = attrLayout.topOffset
            let attrGlobalY = channel.y + fvScale(channel.count) / 2
            let rectTopOffset = attrLayout.top

            return attrGlobalY + attrTopOffset - rectTopOffset
        }

        function drawAttrChannels(layer, channel, initVisible=true) {
            // Ignore mixed3a
            if (layer === 'mixed3a')
                return

            // Get previous layer
            let prevLayer = indexLayer[layerIndex[layer] + 1]

            // Get minimum count of the previous layer
            let prevCounts = dag[prevLayer].map(ch => ch.count)
            let minCounts = d3.min(prevCounts)

            // Offset and padding
            let unitAttrImgSize = fvScale(minCounts)

            // Get attributed channels
            let attrChannels = channel['attr_channels']
            attrChannels.forEach((attrChannel, attrIdx) => {
                let attrChannelName = prevLayer + '-' + attrChannel.prev_channel
                let attrImgId = layer + '-' + channel.channel + '-attr-' + attrChannel.prev_channel
                let attrX = getAttrX(layer, channel, attrIdx)
                let attrY = getAttrY(channel)

                // Draw attributed channels 
                dagG.append('image')
                    .attr('x', 0)
                    .attr('y', 0)
                    // .attr('width', unitAttrImgSize)
                    // .attr('height', unitAttrImgSize)
                    .attr('width', attrFvWidth)
                    .attr('height', attrFvHeight)
                    .attr('xlink:href', '../data/feature-vis/channel/' + attrChannelName + '-channel' + fv_type)
                    // .attr('clip-path', 'url(#fv-clip-path-' + layer + '-' + attrChannel.prev_channel + ')')
                    .attr('clip-path', 'url(#attr-fv-clip-path)')
                    .attr("transform", "translate(" + attrX + ',' + attrY + " )")
                    .style('visibility', initVisible ? 'visible' : 'hidden')
                    .attr('id', attrImgId)
                    .classed('fv-attr', true)
                    .classed(layer + '-' + channel.channel + '-attr', true)

                // Connect mouse event listener to attributed channels
                let attrImg = document.getElementById(attrImgId)
                dagG.selectAll('#' + attrImgId)
                    .on('mousemove', () => {
                        let [mouseX, mouseY] = d3.mouse(attrImg)
                        let diversity = d3.min([d3.max([parseInt(4 * mouseX / unitAttrImgSize), 0]),3])
                        attrImg.setAttribute('href', '../data/feature-vis/diversity-' + diversity + '/' + attrChannelName + '-diversity-' + diversity + fv_type)
                    })
                    .on('mouseout', () => {
                        // let diversity = 0
                        // attrImg.setAttribute('href', '../data/feature-vis/diversity-' + diversity + '/' + attrChannelName + '-diversity-' + diversity + fv_type)
                        attrImg.setAttribute('href', '../data/feature-vis/channel/' + layer + '-' + channel.channel + '-channel' + fv_type)
                    })
                    .on('mouseover', () => {
                        let attrExClass = layer + '-' + channel.channel + '-' + attrChannel.prev_channel + '-dataset-p'
                        dagG.selectAll('.' + attrExClass)
                            .style('visibility', 'visible')

                        let attrExRect = layer + '-' + channel.channel + '-' + attrChannel.prev_channel + '-attr-ex-rect'
                        dagG.selectAll('#' + attrExRect)
                            .style('visibility', 'visible')
                    })
                    .on('mouseout', () => {
                        let attrExClass = layer + '-' + channel.channel + '-' + attrChannel.prev_channel + '-dataset-p'
                        dagG.selectAll('.' + attrExClass)
                            .style('visibility', 'hidden')

                        let attrExRect = layer + '-' + channel.channel + '-' + attrChannel.prev_channel + '-attr-ex-rect'
                        dagG.selectAll('#' + attrExRect)
                            .style('visibility', 'hidden')
                    })
                
            })
        }

        function drawAttrChannelsLayer(layer) {
            dag[layer].forEach(channel => {
                drawAttrChannels(layer, channel, false)
            })
        }

        function drawAttrExamples(layer, channel, initVisible=false) {
            // Ignore mixed3a
            if (layer === 'mixed3a')
                return

            // Get previous layer
            let prevLayer = indexLayer[layerIndex[layer] + 1]
            
            // Get minimum count of the previous layer
            let prevCounts = dag[prevLayer].map(ch => ch.count)
            let minCounts = d3.min(prevCounts)

            // Offset and padding
            let unitAttrImgSize = fvScale(minCounts)
            
            let attrChannels = channel['attr_channels']
            attrChannels.forEach((attrChannel, attrIdx) => {
                let attrX = getAttrX(layer, channel, attrIdx)
                let attrY = getAttrY(channel)

                for (let index = 0; index < 10; index++) {
                    
                    dagG.append('image')
                        .attr('x', 0)
                        .attr('y', 0)
                        .attr('width', deWidth)
                        .attr('height', deHeight)
                        .attr('xlink:href', '../data/feature-vis/dataset-p/' + prevLayer + '-' + attrChannel.prev_channel + '-' + 'dataset-p-' + index + fv_type)
                        .attr('transform', leftTranslation(attrX, attrY, unitAttrImgSize, index))
                        .style('visibility', initVisible ? 'visible' : 'hidden')
                        .classed('attr-de', true)
                        .classed(layer + '-' + channel.channel + '-' + attrChannel.prev_channel + '-dataset-p', true)
                        .attr('id', layer + '-' + channel.channel + '-' + attrChannel.prev_channel + '-dataset-p-' + index)
                        
                }
            })
        }

        function drawAttrExampleRects(layer, channel, attrChannel, attrIdx, initVisible=false) {
            // Ignore mixed3a
            if (layer === 'mixed3a')
                return

            // Get previous layer
            let prevLayer = indexLayer[layerIndex[layer] + 1]
            
            // Get minimum count of the previous layer
            let prevCounts = dag[prevLayer].map(ch => ch.count)
            let minCounts = d3.min(prevCounts)

            // Offset and padding
            let unitAttrImgSize = fvScale(minCounts)

            // Draw background rect
            let attrExRectId = layer + '-' + channel.channel + '-' + attrChannel.prev_channel + '-attr-ex-rect'
            let attrX = getAttrX(layer, channel, attrIdx)
            let attrY = getAttrY(channel)
            let x = (attrX - exRectLayout.offset - deWidth) - 4 * (deWidth + exRectLayout.left) + exRectLayout.right - exRectLayout.left
            let y = attrY + (unitAttrImgSize / 2) - deHeight - exLayout.TBPadding - exLayout.top
            let width = 5 * deWidth + 5 * exRectLayout.left + exRectLayout.right + exRectLayout.left
            let height = 2 * deHeight + exLayout.TBPadding + exLayout.top + exLayout.bottom
            drawBackgroundRect(attrExRectId, x, y, width, height, initVisible)
        }

        function drawAttrExampleRectsLayer(layer) {
            dag[layer].forEach(channel => {
                let attrChannels = channel['attr_channels']
                attrChannels.forEach((attrChannel, attrIdx) => {
                    drawAttrExampleRects(layer, channel, attrChannel, attrIdx, false)
                })
            })
        }

        function drawAttrExamplesLayer(layer) {
            dag[layer].forEach(channel => {
                drawAttrExamples(layer, channel, false)
            })
        }

        function getAttrX(layer, parentChannel, attrIdx) {
            // Get previous layer
            let prevLayer = indexLayer[layerIndex[layer] + 1]

            // Get minimum count of the previous layer
            let prevCounts = dag[prevLayer].map(ch => ch.count)
            let minCounts = d3.min(prevCounts)

            // Offset and padding
            let attrLeftOffset = attrLayout.left
            let attrLeftPadding = attrLayout.right
            let unitAttrImgSize = fvScale(minCounts)

            return parentChannel.x - (attrIdx + 1) * (attrFvWidth + attrLeftPadding) - attrLeftOffset
        }

        function getAttrY(parentChannel) {
            let attrTopOffset = attrLayout.topOffset
            let attrGlobalY = parentChannel.y + fvScale(parentChannel.count) / 2

            return attrGlobalY + attrTopOffset
        }

        function drawAttrChannelLabels(layer, channel, initVisible=true) {
            let attrChannels = channel['attr_channels']
            let parentChannelName = layer + '-' + channel.channel

            attrChannels.forEach((attrChannel, attrIdx) => {
                let attrX = getAttrX(layer, channel, attrIdx)
                let attrY = getAttrY(channel)

                dagG.append('text')
                    .attr('x', attrX)
                    .attr('y', attrY - 3)
                    .text(attrChannel.prev_channel)
                    .classed('attr-ch-label', true)
                    .classed('attr-ch-label-' + layer, true)
                    .classed('attr-ch-label-' + layer + '-' + channel.channel, true)
                    .attr('id', 'attr-ch-label-' + parentChannelName + '-' + attrChannel.prev_channel)
                    .style('visibility', initVisible ? 'visible' : 'hidden')
            })
        }

        function drawAttrChannelLabelsLayer(layer) {
            dag[layer].forEach(channel => {
                drawAttrChannelLabels(layer, channel, false)
            })
        }

        function updateAttrChannelRectLocVis(layer) {
            dag[layer].forEach(channel => {

                // Get attributed background rectangle
                let attrParentName = layer + '-' + channel.channel
                let attrRectId = attrParentName + '-attr-rect'
                let attrRect = document.getElementById(attrRectId)

                // Update location of rectangle
                let rectX = getAttrRectX(layer, channel)
                d3.selectAll('#' + attrRectId)
                    .transition()
                    .duration(filterTransitionSpeed)
                    .attr('x', rectX)

                // Update visibility of rectangle
                attrRect.style.setProperty('visibility', isAlreadyClicked[attrParentName] ? 'visible' : 'hidden')

                // Get attributed channels
                let attrChannels = channel['attr_channels']
                attrChannels.forEach((attrChannel, attrIdx) => {
                    // Get attributed channel
                    let attrImgId = attrParentName + '-attr-' + attrChannel.prev_channel
                    let attrImg = document.getElementById(attrImgId)

                    // Update location of attributed channel
                    let attrX = getAttrX(layer, channel, attrIdx)
                    let attrY = getAttrY(channel)
                    d3.selectAll('#' + attrImgId)
                        .transition()
                        .duration(filterTransitionSpeed)
                        .attr("transform", "translate(" + attrX + ',' + attrY + " )")

                    // Update visibility of attributed channel
                    attrImg.style.setProperty('visibility', isAlreadyClicked[attrParentName] ? 'visible' : 'hidden')

                    // Get edges of attributed channels
                    let attrEdgeId = attrParentName + '-attr-edge-' + attrChannel.prev_channel
                    let attrEdge = document.getElementById(attrEdgeId)

                    // Update location of attributed edges
                    d3.selectAll('#' + attrEdgeId)
                        .transition()
                        .duration(filterTransitionSpeed)
                        .attr('d', genAttrPath(layer, channel, attrIdx))

                    // Update visibility of edges of attributed channels
                    attrEdge.style.setProperty('visibility', isAlreadyClicked[attrParentName] ? 'visible' : 'hidden')
                })

            })
        }

        function updateHiddenAttrVisibility() {
            channelsHidden.forEach(ch => {
                let [hiddenLayer, hiddenChannel] = ch.split('-')
                if (hiddenLayer !== 'mixed3a') {

                    // Hide attributed background rectangle
                    let attrRectId = hiddenLayer + '-' + hiddenChannel + '-attr-rect'
                    let attrRect = document.getElementById(attrRectId)
                    attrRect.style.setProperty('visibility', 'hidden')

                    // Hide attributed channels and edges
                    dag[hiddenLayer].forEach(channel => {

                        if (channel.channel === parseInt(hiddenChannel)) {
                            let attrChannels = channel['attr_channels']
                            attrChannels.forEach((attrChannel, attrIdx) => {

                                // Hide attributed channels
                                let attrImgId = hiddenLayer + '-' + hiddenChannel + '-attr-' + attrChannel.prev_channel
                                let attrImg = document.getElementById(attrImgId)
                                attrImg.style.setProperty('visibility', 'hidden')

                                // Hide edges of attributed channels
                                let attrEdgeId = hiddenLayer + '-' + hiddenChannel + '-attr-edge-' + attrChannel.prev_channel
                                let attrEdge = document.getElementById(attrEdgeId)
                                attrEdge.style.setProperty('visibility', 'hidden')
                            })
                        }
                    })
                }

            })
        }

        function updateAttrChannels() {
            layers.forEach(l => {
                // Ignore mixed3a
                if (l === 'mixed3a')
                    return

                updateAttrChannelRectLocVis(l)
            })
            updateHiddenAttrVisibility()
        }

        function updateAttrLabelLoc(layer) {

            dag[layer].forEach(channel => {

                // Get attributed background rectangle
                let attrParentName = layer + '-' + channel.channel

                // Get attributed channels
                let attrChannels = channel['attr_channels']
                attrChannels.forEach((attrChannel, attrIdx) => {
                    // Get attributed channel label
                    let attrLabelId = 'attr-ch-label-' + attrParentName + '-' + attrChannel.prev_channel
                    let attrLabel = document.getElementById(attrLabelId)

                    // Update location of attributed channel label
                    let attrX = getAttrX(layer, channel, attrIdx)
                    let attrY = getAttrY(channel)
                    d3.selectAll('#' + attrLabelId)
                        .transition()
                        .duration(filterTransitionSpeed)
                        .attr('x', attrX)
                        .attr('y', attrY - 3)

                    // Update visibility of attributed channel
                    attrLabel.style.setProperty('visibility', isAlreadyClicked[attrParentName] ? 'visible' : 'hidden')

                })

            })
        }

        function updateHiddenAttrLabelVisibility() {
            channelsHidden.forEach(ch => {
                let [hiddenLayer, hiddenChannel] = ch.split('-')
                if (hiddenLayer !== 'mixed3a') {

                    // Hide attributed channel labels
                    dag[hiddenLayer].forEach(channel => {

                        if (channel.channel === parseInt(hiddenChannel)) {
                            let attrChannels = channel['attr_channels']
                            attrChannels.forEach((attrChannel, attrIdx) => {
                                // Hide attributed channels
                                let attrLabelId = 'attr-ch-label-' + hiddenLayer + '-' + hiddenChannel + '-' + attrChannel.prev_channel
                                let attrLabel = document.getElementById(attrLabelId)
                                attrLabel.style.setProperty('visibility', 'hidden')
                            })
                        }
                    })
                }

            })
        }

        function updateAttrLabels() {
            layers.forEach(l => {
                // Ignore mixed3a
                if (l === 'mixed3a')
                    return

                updateAttrLabelLoc(l)
            })

            updateHiddenAttrLabelVisibility()
        }

        function updateAttrExLayer(layer) {
            // Get previous layer
            let prevLayer = indexLayer[layerIndex[layer] + 1]
                    
            // Get minimum count of the previous layer
            let prevCounts = dag[prevLayer].map(ch => ch.count)
            let minCounts = d3.min(prevCounts)

            // Offset and padding
            let unitAttrImgSize = fvScale(minCounts)
            
            dag[layer].forEach(channel => {
                let attrChannels = channel['attr_channels']
                attrChannels.forEach((attrChannel, attrIdx) => {
                    
                    let attrX = getAttrX(layer, channel, attrIdx)
                    let attrY = getAttrY(channel)

                    for (let index = 0; index < 10; index++) {
                        let attrExId = layer + '-' + channel.channel + '-' + attrChannel.prev_channel + '-dataset-p-' + index
                        let attrEx = document.getElementById(attrExId)
                        attrEx.setAttribute('transform', leftTranslation(attrX, attrY, unitAttrImgSize, index))
                    }
                    
                })
            })
        }

        function updateAttrExRectLayer(layer) {
            // Get previous layer
            let prevLayer = indexLayer[layerIndex[layer] + 1]
                    
            // Get minimum count of the previous layer
            let prevCounts = dag[prevLayer].map(ch => ch.count)
            let minCounts = d3.min(prevCounts)

            // Offset and padding
            let unitAttrImgSize = fvScale(minCounts)

            dag[layer].forEach(channel => {
                let attrChannels = channel['attr_channels']
                attrChannels.forEach((attrChannel, attrIdx) => {

                    // Draw background rect
                    let attrExRectId = layer + '-' + channel.channel + '-' + attrChannel.prev_channel + '-attr-ex-rect'
                    let attrX = getAttrX(layer, channel, attrIdx)
                    let attrY = getAttrY(channel)
                    let x = (attrX - exRectLayout.offset - deWidth) - 4 * (deWidth + exRectLayout.left) + exRectLayout.right - exRectLayout.left
                    let y = attrY + (unitAttrImgSize / 2) - deHeight - exLayout.TBPadding - exLayout.top

                    // Update the location of attributed example rectangle
                    let attrExRect = document.getElementById(attrExRectId)
                    attrExRect.setAttribute('x', x)
                    attrExRect.setAttribute('y', y)
                })
            })

        }

        function updateAttrExRect() {
            layers.forEach(l => {
                // Ignore mixed3a
                if (l === 'mixed3a')
                    return

                updateAttrExLayer(l)
                updateAttrExRectLayer(l)
            })
        }


        function drawAttrEdges(layer, channel, initVisible=true) {
            // Ignore mixed3a
            if (layer === 'mixed3a')
                return

            // Get previous layer
            let prevLayer = indexLayer[layerIndex[layer] + 1]

            // Draw attributed edges 
            let attrChannels = channel['attr_channels']
            attrChannels.forEach((attrChannel, attrIdx) => {
                let attrEdgeID = layer + '-' + channel.channel + '-attr-edge-' + attrChannel.prev_channel

                dagG.append('path')
                    .attr('d', genAttrPath(layer, channel, attrIdx))
                    .style('stroke-width', edgeScale(attrChannel.inf))
                    .attr('class', () => {
                        let classString = 'dag-edge' +
                            ' ' + 'dag-edge-' + layer +
                            ' ' + 'dag-edge-' + layer + '-' + channel.channel +
                            ' ' + 'dag-edge-attr-' + layer + '-' + channel.channel
                        // ' ' + 'dag-edge-' + layer + '-' + channel.channel + '-out'

                        if (channel.layer != 'mixed5b') {
                            classString += ' ' + 'dag-edge-' + prevLayer + '-' + channel['prev_channel'] + '-in'
                        }

                        return classString

                    })
                    .attr('id', attrEdgeID)
                    .style('visibility', initVisible ? 'visible' : 'hidden')
                    .on('mouseover', () => {
                        // XXX
                        console.log('mouse over')
                        // Show top rect
                        let topRectId = layer + '-' + channel.channel + '-ex-rect'
                        dagG.select('#' + topRectId)
                            .style('visibility', 'visible')

                        // Show top exs
                        let topExampleClass = layer + '-' + channel.channel + '-dataset-p'
                        dagG.selectAll('.' + topExampleClass)
                            .style('visibility', 'visible')
                            // .style('opacity', 1)
                            // .style('display', 'block')

                        // Show bottom rect
                        let botRectId = layer + '-' + channel.channel + '-' + attrChannel.prev_channel + '-attr-ex-rect'
                        dagG.select('#' + botRectId)
                            .style('visibility', 'visible')

                        // Show bottom exs
                        let botExampleClass = layer + '-' + channel.channel + '-' + attrChannel.prev_channel + '-dataset-p'
                        dagG.selectAll('.' + botExampleClass)
                            .style('visibility', 'visible')              
                    })
                    .on('mouseout', () => {
                        // Hide top rect
                        let topRectId = layer + '-' + channel.channel + '-ex-rect'
                        dagG.select('#' + topRectId)
                            .style('visibility', 'hidden')

                        // Hide top exs
                        let topExampleClass = layer + '-' + channel.channel + '-dataset-p'
                        dagG.selectAll('.' + topExampleClass)
                            .style('visibility', 'hidden')
                            // .style('opacity', 0)
                            // .style('display', 'none')

                        // Hide bottom rect
                        let botRectId = layer + '-' + channel.channel + '-' + attrChannel.prev_channel + '-attr-ex-rect'
                        dagG.select('#' + botRectId)
                            .style('visibility', 'hidden')

                        // Hide bottom exs
                        let botExampleClass = layer + '-' + channel.channel + '-' + attrChannel.prev_channel + '-dataset-p'
                        dagG.selectAll('.' + botExampleClass)
                            .style('visibility', 'hidden')
                    })
            })
        }

        function genAttrPath(layer, channel, attrIdx) {
            // Get previous layer
            let prevLayer = indexLayer[layerIndex[layer] + 1]

            // Get minimum count of the previous layer
            let prevCounts = dag[prevLayer].map(ch => ch.count)
            let minCounts = d3.min(prevCounts)

            // Offset and padding
            let unitAttrImgSize = fvScale(minCounts)
            let attrX = getAttrX(layer, channel, attrIdx)
            let attrY = getAttrY(channel)
            let attrWidth = unitAttrImgSize

            let startingX = channel.x
            let startingY = channel.y + channel.width / 2
            let endingX = attrX + attrWidth / 2
            let endingY = attrY + 5
            let turningX = (startingX + endingX) / 2 - 20
            let turningY = (startingY + endingY) / 2 - 20

            return "M" + startingX + "," + startingY
                + "S" + turningX + " " + turningY + ","
                + endingX + " " + endingY
        }

        function drawAttrEdgesLayer(layer) {
            dag[layer].forEach(channel => {
                drawAttrEdges(layer, channel, false)
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
                .on('mouseover', function (curr_channel) {
                    d3.selectAll('.fv-ch').attr('filter', 'url(#grayscale)')
                    d3.select(this).attr('filter', null)

                    // let curr_channel = d3.select(this).data()[0]
                    let hoveredChannel = layer + '-' + curr_channel.channel

                    // Make dataset images visible
                    for (let index = 0; index < 10; index++) {
                        let exImg = document.getElementById(hoveredChannel + '-dataset-p-' + index)
                        exImg.style.setProperty('visibility', 'visible')
                    }

                    d3.selectAll('.dag-edge-' + hoveredChannel + '-in')
                        .classed('dag-edge-animate-in', true)

                    d3.selectAll('.dag-edge-' + hoveredChannel + '-out')
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

                    d3.selectAll('#' + hoveredChannel + '-ex-rect')
                        .style('visibility', 'visible')

                    d3.selectAll('#' + hoveredChannel + '-attr-rect')
                        .style('visibility', 'visible')

                    d3.selectAll('.' + hoveredChannel + '-attr')
                        .style('visibility', 'visible')

                    d3.selectAll('.' + 'dag-edge-' + hoveredChannel)
                        .style('visibility', 'visible')

                    d3.selectAll('.' + 'attr-ch-label-' + hoveredChannel)
                        .style('visibility', 'visible')

                })
                .on('mousemove', function (d) {
                    // diversity hovering
                    let [mouseX, mouseY] = d3.mouse(this)
                    let channelSelection = d3.select(this)
                    let diversity = d3.min([d3.max([parseInt(4 * mouseX / d.width),0]),3])

                    channelSelection.attr('xlink:href', '../data/feature-vis/diversity-' + diversity + '/' + d.layer + '-' + d.channel + '-diversity-' + diversity + fv_type)

                })
                .on('mouseout', function (d) {

                    let channelSelection = d3.select(this)
                    let hoveredChannel = layer + '-' + d.channel

                    d3.selectAll('.fv-ch').attr('filter', null)

                    d3.selectAll('.' + layer + '-' + d.channel + '-dataset-p')
                        // .transition()
                        // .duration(750)
                        // .attr("transform", (d, i) => {
                        // return "translate(" + curr_channel.x + ", " + (curr_channel.y + fvHeight / 4)  + ")" // center left
                        // return "translate(" + (curr_channel.x+fvWidth/4) + ", " + (curr_channel.y + fvHeight / 4) + ")"
                        // })
                        .style('visibility', 'hidden')


                    d3.selectAll('.dag-edge-' + layer + '-' + d.channel + '-in')
                        .classed('dag-edge-animate-in', false)

                    d3.selectAll('.dag-edge-' + layer + '-' + d.channel + '-out')
                        .classed('dag-edge-animate-out', false)

                    channelSelection.attr('xlink:href', d => '../data/feature-vis/channel/' + layer + '-' + d.channel + '-channel' + fv_type)

                    d3.selectAll('#' + hoveredChannel + '-ex-rect')
                        .style('visibility', 'hidden')

                    d3.selectAll('#' + hoveredChannel + '-attr-rect')
                        .style('visibility', isAlreadyClicked[hoveredChannel] ? 'visible' : 'hidden')

                    d3.selectAll('.' + hoveredChannel + '-attr')
                        .style('visibility', isAlreadyClicked[hoveredChannel] ? 'visible' : 'hidden')

                    d3.selectAll('.' + 'dag-edge-attr-' + hoveredChannel)
                        .style('visibility', isAlreadyClicked[hoveredChannel] ? 'visible' : 'hidden')

                    d3.selectAll('.' + 'attr-ch-label-' + hoveredChannel)
                        .style('visibility', isAlreadyClicked[hoveredChannel] ? 'visible' : 'hidden')

                })
                .on('click', function (d) {
                    let clickedChannel = layer + '-' + d.channel
                    if (!(clickedChannel in isAlreadyClicked)) {
                        isAlreadyClicked[clickedChannel] = false
                    }

                    // Get attributed channels
                    let attrChannels = d['attr_channels']

                    // Toggle background white rect
                    let attrRectId = layer + '-' + d.channel + '-attr-rect'
                    let attrRect = document.getElementById(attrRectId)
                    attrRect.style.setProperty('visibility', isAlreadyClicked[clickedChannel] ? 'hidden' : 'visible')

                    // Toggle attributed channels
                    attrChannels.forEach(attrChannel => {
                        let attrImgId = layer + '-' + d.channel + '-attr-' + attrChannel.prev_channel
                        let attrImg = document.getElementById(attrImgId)
                        attrImg.style.setProperty('visibility', isAlreadyClicked[clickedChannel] ? 'hidden' : 'visible')
                    })

                    // Toggle attributed edges
                    attrChannels.forEach(attrChannel => {
                        let attrEdgeID = layer + '-' + d.channel + '-attr-edge-' + attrChannel.prev_channel
                        let attrEdge = document.getElementById(attrEdgeID)
                        attrEdge.style.setProperty('visibility', isAlreadyClicked[clickedChannel] ? 'hidden' : 'visible')
                    })

                    // Toggle attributed channel labels
                    attrChannels.forEach(attrChannel => {
                        let attrLabelID = 'attr-ch-label-' + layer + '-' + d.channel + '-' + attrChannel.prev_channel
                        let attrLabel = document.getElementById(attrLabelID)
                        attrLabel.style.setProperty('visibility', isAlreadyClicked[clickedChannel] ? 'hidden' : 'visible')
                    })

                    isAlreadyClicked[clickedChannel] = !isAlreadyClicked[clickedChannel]
                })

            // Write channel label
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
                .attr('transform', d => 'translate(' + (0 - (fvWidth / 4 + ((dag[d].length * fvWidth + (dag[d].length - 1) * fvHorizontalSpace) / 2))) + ',' + (layerIndex[d] * layerVerticalSpace + fvHeight / 2) + ')')
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
                .on('mouseover', function () {
                    let edgeID = d3.select(this).attr('id').split('-')
                    let topLayer = edgeID[2]
                    let topChannel = edgeID[3]
                    let bottomLayer = edgeID[4]
                    let bottomChannel = edgeID[5]

                    d3.selectAll('.fv-ch').attr('filter', 'url(#grayscale)')
                    d3.select('#' + topLayer + '-' + topChannel + '-channel').attr('filter', null)
                    d3.select('#' + bottomLayer + '-' + bottomChannel + '-channel').attr('filter', null)

                    d3.selectAll('.' + topLayer + '-' + topChannel + '-dataset-p')
                        // .style('display', 'block')
                        // .style('opacity', 1)
                        .style('visibility', 'visible')

                    d3.selectAll('.' + bottomLayer + '-' + bottomChannel + '-dataset-p')
                        // .style('display', 'block')
                        // .style('opacity', 1)
                        .style('visibility', 'visible')

                    d3.select('#' + topLayer + '-' + topChannel + '-ex-rect')
                        .style('visibility', 'visible')
                    
                    d3.select('#' + bottomLayer + '-' + bottomChannel + '-ex-rect')
                        .style('visibility', 'visible')

                })
                .on('mouseout', function () {
                    let edgeID = d3.select(this).attr('id').split('-')
                    let topLayer = edgeID[2]
                    let topChannel = edgeID[3]
                    let bottomLayer = edgeID[4]
                    let bottomChannel = edgeID[5]

                    d3.selectAll('.fv-ch').attr('filter', null)

                    d3.selectAll('.fv-de')
                        .style('visibility', 'hidden')
                    
                    d3.select('#' + topLayer + '-' + topChannel + '-ex-rect')
                        .style('visibility', 'hidden')
                    
                    d3.select('#' + bottomLayer + '-' + bottomChannel + '-ex-rect')
                        .style('visibility', 'hidden')
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

        function updateChannelLabels() {
            layers.forEach(layer => {
                dagG.selectAll('.fv-ch-label-' + layer)
                    .transition()
                    .duration(filterTransitionSpeed)
                    .attr('x', d => d.x)
                    .attr('y', d => d.y - 3)
            })
        }

        function updateLayerLabels(filterValue) {
            layers.forEach(layer => {
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
            layers.forEach(layer => {
                for (let channel = 0; channel < dag[layer].length; channel++) {

                    let currChannel = dag[layer][channel]

                    for (let index = 0; index < 10; index++) {
                        // Update dataset examples
                        d3.select('#' + layer + '-' + currChannel.channel + '-' + 'dataset-p-' + index)
                            .attr('transform', rightTranslation(currChannel.x, currChannel.y, currChannel.width, index))
                        // .attr("transform", () => { // centered up top
                        //     if (index < 5) {
                        //         return "translate(" + ((dag[layer][channel].x + index * deWidth) + (index + 1) * 2 - (fvWidth - dag[layer][channel].width) / 2 - deWidth * 1.5 - 1.5 * 2) + ", " + (dag[layer][channel].y - deHeight - 1 - 15) + ")"
                        //     } else if (index >= 5) {
                        //         return "translate(" + ((dag[layer][channel].x + (index - 5) * deWidth) + (index - 5 + 1) * 2 - (fvWidth - dag[layer][channel].width) / 2 - deWidth * 1.5 - 1.5 * 2) + ", " + (dag[layer][channel].y - 2 * (deHeight + 1) - 15) + ")"
                        //     }
                        // })
                        // .attr("transform", () => { // centered up top
                        //     if (index < 5) {
                        //         return "translate(" + ((dag[layer][channel].x + index * deWidth + (index + 1) * 2) - deWidth * 1.5 - 1.5 * 2) + ", " + (dag[layer][channel].y - deHeight - 1) + ")"
                        //     } else if (index >= 5) {
                        //         return "translate(" + ((dag[layer][channel].x + (index - 5) * deWidth + (index - 5 + 1) * 2) - deWidth * 1.5 - 1.5 * 2) + ", " + (dag[layer][channel].y - 2 * (deHeight + 1)) + ")"
                        //     }
                        // })

                        // Update background rectangle
                        let rectId = layer + '-' + currChannel.channel + '-ex-rect'
                        let x = getExRectX(currChannel)
                        let y = getExRectY(currChannel)
                        d3.select('#' + rectId)
                            .attr('x', x)
                            .attr('y', y)
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

                drawChannels(l)
                drawAttrEdgesLayer(l)
                drawAttrRectsLayer(l)
                drawExamplesForLayer(l)
                drawAttrChannelLabelsLayer(l)
                drawAttrChannelsLayer(l)
                drawAttrExampleRectsLayer(l)
                drawAttrExamplesLayer(l)
            });

            drawLayerLabels()

            d3.select('#dag-channel-count-filter-slider')
                .on('input', function () {

                    let filterValue = this.value
                    console.log('filterValue:', filterValue)

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

                    // Update visibility of edges
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
                    updateAttrChannels()
                    updateAttrLabels()
                    updateAttrExRect()

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
