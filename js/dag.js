import * as d3 from "d3"

let rightInner = d3.select('#right-inner')

let rightInnerOptions = d3.select('#right-inner-options')

let rightInnerEmbeddingWrapper = d3.select('#right-inner-tree-wrapper')

let test = rightInnerEmbeddingWrapper
    .append('div')
    // .classed('dataset-examples', true)
test
    .append('style')
    .text('.sprite {background-image: url(../data/feature-vis/mixed4b-00310--mixed4b-00319.jpg)}')

test
    .append('div')
        .attr('id', 'test-div')
        .classed('sprite', true)
        .classed('channel-diversity-0', true)
        .classed('index-0', true)
    // .append('span')
        // .attr('id', 'test-span')

