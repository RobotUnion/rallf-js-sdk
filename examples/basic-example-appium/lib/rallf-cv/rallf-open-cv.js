
const cv = require('opencv');

class RallfCV {
  constructor() { }

  /**
   * 
   * @param {string} img - a image path
   * @param {string} template - a image path
   */
  match(img, template) {

    img = cv.readImage(img);
    template = cv.readImage(template);

    return cv.matchTemplate(img, template, cv.TM_CCOEFF_NORMED);
  }
}



