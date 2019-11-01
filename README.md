# Summit

Summit is an interactive system that scalably and systematically summarizes and visualizes what features a deep learning model has learned and how those features interact to make predictions.

🏔️ **Live demo:** [fredhohman.com/summit][demo]  
📘 **Paper:** [https://fredhohman.com/papers/19-summit-vast.pdf][paper]  
🎥 **Video:** [https://youtu.be/J4GMLvoH1ZU][video]  
💻 **Code:** [https://github.com/fredhohman/summit][summit]  
📺 **Slides:** [https://fredhohman.com/slides/19-summit-vast-slides.pdf][slides]  
🎤 **Recording:** [https://vimeo.com/368704428][recording]

**[Summit: Scaling Deep Learning Interpretability by Visualizing Activation and Attribution Summarizations](https://fredhohman.com/papers/summit)**  
Fred Hohman, Haekyu Park, Caleb Robinson, Duen Horng (Polo) Chau  
*IEEE Transactions on Visualization and Computer Graphics (TVCG, Proc. VAST'19). 2020.*  

[![Summit overview YouTube video](thumbnail.png)](https://youtu.be/J4GMLvoH1ZU)


## Live Demo

For a live demo, visit: [fredhohman.com/summit][demo].


## Other Repositories

For the Summit notebook code, Visualization: [`summit-notebooks`][summit-notebooks].  
For the Summit data, visit: [`summit-data`][summit-data].


## Running Locally

Download or clone this repository:

```bash
git clone https://github.com/fredhohman/summit.git
```

Download the data from [`summit-data`][summit-data]:

```bash
git clone https://github.com/fredhohman/summit-data.git
```

Place `summit-data`'s `data` folder in the top level of the `summit` repo.
Then, within `summit` run:

```bash
npm install
npm run build
npm run start
```


## Requirements

Summit requires [npm][npm] to run.


## License

MIT License. See [`LICENSE.md`](LICENSE.md).


## Citation

```
@article{hohman2020summit,
  title={Summit: Scaling Deep Learning Interpretability by Visualizing Activation and Attribution Summarizations},
  author={Hohman, Fred and Park, Haekyu and Robinson, Caleb and Chau, Duen Horng},
  journal={IEEE Transactions on Visualization and Computer Graphics (TVCG)},
  year={2020},
  publisher={IEEE},
  url={https://fredhohman.com/summit/}
}
```


## Contact

For questions or support [open an issue][issues] or contact [Fred Hohman][fred].

[summit]: https://github.com/fredhohman/summit
[summit-notebooks]: https://github.com/fredhohman/summit-notebooks
[summit-data]: https://github.com/fredhohman/summit-data
[npm]: https://www.npmjs.com
[fred]: http://www.fredhohman.com
[issues]: https://github.com/fredhohman/summit/issues
[demo]: https://fredhohman.com/summit/
[video]: https://youtu.be/J4GMLvoH1ZU
[paper]: https://fredhohman.com/papers/19-summit-vast.pdf
[slides]: https://fredhohman.com/slides/19-summit-vast-slides.pdf
[recording]: https://vimeo.com/368704428