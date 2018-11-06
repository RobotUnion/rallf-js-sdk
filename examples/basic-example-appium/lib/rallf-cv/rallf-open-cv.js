
const cv = require('opencv4nodejs');

class RallfCV {
  constructor() {
    this.cv = cv;
  }


  /**
   * 
   * @param {string} img - a image path
   * @param {string} template - a image path
   */
  match(img, template) {
    let imgPic = cv.imread(img);
    let output = imgPic.matchTemplate(template, 3);


    // await cv.imshowWait('Detected', img);
    return output;
  }
}


module.exports = new RallfCV();
