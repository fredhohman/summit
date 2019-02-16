import style from "../css/style.css";
import * as d3 from "d3"

console.log(`I'm a silly entry point`);

d3.select('body').append('div').text('d3 works')

d3.csv('./data/test.csv').then(function(data) {
  console.log(data);
});

d3.json('./data/imagenet.json').then(function (data) {
    console.log(data);
});