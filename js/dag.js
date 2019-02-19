import * as d3 from "d3"

let rightInner = d3.select('#right-inner')

let rightInnerOptions = d3.select('#right-inner-options')

let rightInnerEmbeddingWrapper = d3.select('#right-inner-tree-wrapper')

rightInnerEmbeddingWrapper
    .append('div')
        .attr('id', 'test-div')
    .append('span')
        .attr('id', 'test-span')

