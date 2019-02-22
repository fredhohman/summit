import * as d3 from "d3"


let rightInner = d3.select('#right-inner')

let rightInnerOptions = d3.select('#right-inner-options')

let rightInnerDagWrapper = d3.select('#right-inner-dag-wrapper')

let test = rightInnerDagWrapper
    .append('div')
    // .classed('dataset-examples', true)
test
    .append('style')
    .text('.sprite {background-image: url(../data/feature-vis/mixed4b-00310--mixed4b-00319.jpg)}')

test
    .append('div')
        .attr('id', 'test-div')
        .classed('sprite', true)
        // .classed('channel-diversity-0', true)
        .classed('index-0', true)
        // .on('mouseover', () => {
        //     // d3.select('#test-div')
        //     // .transition()
        //     // .duration(1000)
        //     // .style('background-position-x', '-441px')
        //     // .transition()
        //     // .duration(1000)
        //     // .style('background-position-x', '-588px')
        // })
        // .on('mouseout', () => {
        // })
    // .append('span')
        // .attr('id', 'test-span')



const dagMargin = ({ top: 40, right: 40, bottom: 40, left: 40 })
const dagWidth = 700 - dagMargin.left - dagMargin.right
const dagHeight = 700 - dagMargin.top - dagMargin.bottom // 790 based on laptop screen height
let k = 1; // dag zoom scale

let zoom = d3.zoom()
    .scaleExtent([.5, 90])
    .extent([[0, 0], [dagWidth, dagHeight]])
    .on("zoom", zoomed);

function zoomed() {
    d3.select('#dagG').attr("transform", d3.event.transform);
    console.log(d3.event.transform)
}

let dagSVG = rightInnerDagWrapper
    .append('svg')
    .attr('viewBox', '0 0 ' + (dagWidth + dagMargin.left + dagMargin.right) + ' ' + (dagHeight + dagMargin.top + dagMargin.bottom))
    .attr('width', '100%')
    .style('border', '1px solid #eeeeee') // for debugging
    .attr('id', 'dag')
    // .call(zoom)

let zoomRect = dagSVG.append("rect")
    .attr("width", dagWidth)
    .attr("height", dagHeight)
    .style("fill", "none")
    .style("pointer-events", "all")
    .attr('transform', 'translate(' + dagMargin.left + ',' + dagMargin.top + ')')
    .call(zoom);

let dagG = dagSVG
    .append("g")
    .attr("transform", "translate(" + dagMargin.left + "," + dagMargin.top + ")")
    .attr('id', 'dagG')

let dagDefs = dagSVG.append('defs')

const fvWidth = 100
const fvHeight = fvWidth
dagDefs.append('clipPath')
    .attr('id', 'fv-clip-path')
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', fvWidth)
    .attr('height', fvHeight)
    .attr('rx', 10)
    .attr('ry', 10)

dagG.append('image')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', fvWidth)
    .attr('height', fvHeight)
    .attr('xlink:href', '../data/feature-vis/mixed4d-376-channel.png')
    .classed('fv-channel', true)
    .attr('clip-path', 'url(#fv-clip-path)')
    .attr("transform", "translate(400, 100)")
