import * as d3 from "d3"
import { layerChannelCounts, layer } from './class-sidebar'
import { createGunzip } from "zlib";

console.log(layerChannelCounts)
let rightInner = d3.select('#right-inner')

let rightInnerOptions = d3.select('#right-inner-options')

let rightInnerDagWrapper = d3.select('#right-inner-dag-wrapper')

// let test = rightInnerDagWrapper
//     .append('div')
//     // .classed('dataset-examples', true)
// test
//     .append('style')
//     .text('.sprite {background-image: url(../data/feature-vis/mixed4b-00310--mixed4b-00319.jpg)}')

// test
//     .append('div')
//         .attr('id', 'test-div')
//         .classed('sprite', true)
//         // .classed('channel-diversity-0', true)
//         .classed('index-0', true)
//         // .on('mouseover', () => {
//         //     // d3.select('#test-div')
//         //     // .transition()
//         //     // .duration(1000)
//         //     // .style('background-position-x', '-441px')
//         //     // .transition()
//         //     // .duration(1000)
//         //     // .style('background-position-x', '-588px')
//         // })
//         // .on('mouseout', () => {
//         // })
//     // .append('span')
//         // .attr('id', 'test-span')

// let layers = ['mixed5b', 'mixed5a', 'mixed4e', 'mixed4d', 'mixed4c', 'mixed4b']
// let layers = ['mixed5b', 'mixed5a', 'mixed4e']
// let layers = ['mixed5a', 'mixed4e']
let layers = Object.keys(layerChannelCounts).reverse()

const dagMargin = ({ top: 40, right: 40, bottom: 40, left: 40 })
const dagWidth = 1000 - dagMargin.left - dagMargin.right
const dagHeight = 800 - dagMargin.top - dagMargin.bottom // 790 based on laptop screen height
let k = 1; // dag zoom scale

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
    .attr("width", dagWidth)
    .attr("height", dagHeight)
    .style("fill", "none")
    .style("pointer-events", "all")
    .attr('transform', 'translate(' + dagMargin.left + ',' + dagMargin.top + ')')
    .call(zoom);

let dagDefs = dagSVG.append('defs')

const fvWidth = 100
const fvHeight = fvWidth

const deWidth = 49
const deHeight = deWidth

const layerVerticalSpace = 450
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

dagDefs.append('clipPath')
    .attr('id', 'fv-clip-path')
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', fvWidth)
    .attr('height', fvHeight)
    .attr('rx', 10)
    .attr('ry', 10)

dagDefs.append('clipPath')
    .attr('id', 'de-clip-path')
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', deWidth)
    .attr('height', deHeight)
    .attr('rx', 4)
    .attr('ry', 4)

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

export function dagVIS(selectedClass) {
    console.log('dagVIS', selectedClass)
        
    d3.json('./data/dag/dag-' + selectedClass + '.json').then(function (dag) {
        console.log(dag);

        let dagG = dagSVG
            .append("g")
            .attr("transform", "translate(" + dagMargin.left + "," + dagMargin.top + ")")
            .attr('id', 'dagG')

        function drawOrigin(){
            dagG.append('circle')
                .attr('r', 10)
                .attr('cx', 0)
                .attr('cy', 0)
        }
        drawOrigin()

        function centerDag() {
            zoomRect.transition().duration(750).call(zoom.transform, d3.zoomIdentity.scale(1).translate(dagWidth/2, 50));
        }
        centerDag()
        d3.select('#dag-home').on('click', () => {
            centerDag()
        })

        function computeChannelCoordinates(layer) {

            let i = 0
            dag[layer].forEach(ch => {
                ch.x = (((fvWidth + fvHorizontalSpace) * i) - ((dag[layer].length * fvWidth + (dag[layer].length - 1) * fvHorizontalSpace) / 2))
                ch.y = layerIndex[layer] * layerVerticalSpace
                i = i + 1
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
                .attr('xlink:href', '../data/feature-vis/dataset-p/' + layer + '-' + channel.channel + '-' + 'dataset-p-' + index + '.png')
                .classed('fv-de', true)
                .attr('clip-path', 'url(#de-clip-path)')
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
                        return "translate(" + ((channel.x + index * deWidth + (index + 1) * 2)-deWidth*1.5 - 1.5*2) + ", " + (channel.y - deHeight - 1) + ")"
                    } else if (index >= 5) {
                        return "translate(" + ((channel.x + (index - 5) * deWidth + (index - 5 + 1) * 2)-deWidth*1.5 - 1.5*2) + ", " + (channel.y - 2 * (deHeight + 1)) + ")"
                    }
                })
                .style('opacity', 0)
                .style('display', 'none')

                .attr('id', layer + '-' + channel.channel + '-' + 'dataset-p-' + index)
                .classed(layer + '-' + channel.channel + '-' + 'dataset-p', true)
        }
        
        function drawChannels(layer) {
            
            dagG.selectAll('.fv-ch-' + layer)
                .data(dag[layer])
                .enter()
                .append('image')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', fvWidth)
                .attr('height', fvHeight)
                .attr('xlink:href', d => '../data/feature-vis/channel/' + layer + '-' + d.channel + '-channel.png')
                .attr('clip-path', 'url(#fv-clip-path)')
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

                    // let t = setInterval(() => {

                    // d3.select('#mixed4d-101-channel').attr('xlink:href', '../data/feature-vis/mixed4d-376-diversity-0.png')
                    // // d3.select('#mixed4d-376-channel').attr('xlink:href', '../data/feature-vis/mixed4d-376-diversity-1.png')
                    // // d3.select('#mixed4d-376-channel').attr('xlink:href', '../data/feature-vis/mixed4d-376-diversity-2.png')
                    // // d3.select('#mixed4d-376-channel').attr('xlink:href', '../data/feature-vis/mixed4d-376-diversity-3.png')

                    // }, 1000);

                })
                .on('mouseout', function() {
                    d3.selectAll('.fv-ch').attr('filter', null)

                    let curr_channel = d3.select(this).data()[0]

                    d3.selectAll('.' + layer + '-' + curr_channel.channel + '-dataset-p')
                        // .transition()
                        // .duration(750)
                        // .attr("transform", (d, i) => {
                            // return "translate(" + curr_channel.x + ", " + (curr_channel.y + fvHeight / 4)  + ")" // center left
                            // return "translate(" + (curr_channel.x+fvWidth/4) + ", " + (curr_channel.y + fvHeight / 4) + ")"
                        // })
                        .style('opacity', 0)
                        .style('display', 'none')
                })

            dagG.selectAll('.fv-ch-label-' + layer)
                .data(dag[layer])
                .enter()
                .append('text')
                .attr('x', d => d.x)
                .attr('y', d => d.y - 3)
                .text(d => d.channel)
                .classed('fv-ch-label', true)

        }

        
        function drawLayerLabels() {
            dagG.selectAll('.dag-layer-label')
                .data(layers)
                .enter()    
                .append('text')
                // .attr('x', d => 0 - ((dag[d].length * fvWidth + (dag[d].length - 1) * fvHorizontalSpace) / 2))
                // .attr('y', (d, i) => layerIndex[d] * layerVerticalSpace)
                .text(d => d)
                .attr('transform', d => 'translate(' + (0 - (fvWidth/4 + ((dag[d].length * fvWidth + (dag[d].length - 1) * fvHorizontalSpace) / 2))) + ',' + (layerIndex[d] * layerVerticalSpace + fvHeight/2) + ')rotate(-90)')
                .attr('text-anchor', 'middle')
                .classed('dag-layer-label', true)

        }

        let edgeScale = d3.scaleLinear()
            .domain([0, 1300]) // check this, do d3.max instead? OR 1300
            .range([0, 6])

        function drawEdgesPerLayer(layer, channel) {

            dagG.selectAll('.dag-edge-temp-' + layer) // need the throwaway class since we do this for every channel and use multiple classes
                .data(channel['prev_channels'])
                .enter()
                .append('path')
                .attr('d', d => {
                    let layerToConnectTo = indexLayer[layerIndex[layer] + 1]
                    let channelToConnectTo = dag[layerToConnectTo].find(function (element) {
                        return element.channel === d['prev_channel'];
                    });

                    return "M" + (channel.x + fvWidth / 2) + "," + (channel.y + fvHeight)
                        + "C" + (channel.x + fvWidth / 2) + " " + (channel.y + fvHeight
                            + layerVerticalSpace/2) + "," + (channelToConnectTo.x + fvWidth/2) + " "
                            + (channelToConnectTo.y - layerVerticalSpace / 2) + ","
                            + (channelToConnectTo.x + fvWidth/2) + " " + channelToConnectTo.y
                })
                .style('stroke-width', d => edgeScale(d.inf))
                .classed('dag-edge', true)
                .classed('dag-edge-' + layer, true)
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
                })
                .on('mouseout', function () {
                    d3.selectAll('.fv-ch').attr('filter', null)
                })
        }

        function drawEdges() {
            // 
            // HARD CODED, REPLACED WITH ALL LAYERS
            // 
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

        function drawDAG() {
            layers.forEach(l => {
                console.log('compute layer ', l)
                computeChannelCoordinates(l)
            });
            
            drawEdges()

            layers.forEach(l => {
                drawExamplesForLayer(l)
            });
            
            layers.forEach(l => {
                drawChannels(l)
            });
            
            drawLayerLabels()
        }

        drawDAG()


    })

}

export function removeDagVIS() {
    d3.select("#dagG").remove()
}