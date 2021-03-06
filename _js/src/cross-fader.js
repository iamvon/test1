
/*
eslint-disable
no-param-reassign,
import/no-extraneous-dependencies,
import/no-unresolved,
import/extensions,
class-methods-use-this,
*/

import { Observable } from 'rxjs/Observable';
import { empty } from 'rxjs/observable/empty';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { timer } from 'rxjs/observable/timer';
import Color from 'color';

import { _do as effect } from 'rxjs/operator/do';
import { _finally as cleanup } from 'rxjs/operator/finally';
import { map } from 'rxjs/operator/map';
import { zipProto as zipWith } from 'rxjs/operator/zip';

import { animate } from './common';

const { find } = Array.prototype;

const BORDER_COLOR_FADE = 0.8;

function updateStyle({ color = '#00f' } = {}) {
  this.rules[0].style.color = color; // .content a
  this.rules[0].style.borderColor = Color(color).fade(BORDER_COLOR_FADE).string();
  this.rules[1].style.borderColor = color;
  this.rules[2].style.outlineColor = color; // :focus
  this.rules[3].style.backgroundColor = color; // ::selection
}

export default class CrossFader {
  constructor({ duration }) {
    this.sidebar = document.getElementById('_sidebar');
    this.duration = duration;

    const pageStyle = document.getElementById('_pageStyle');
    const styleSheet = document.styleSheets::find(ss => ss.ownerNode === pageStyle);
    this.rules = styleSheet.cssRules || styleSheet.rules;
    this.lastImage = document.getElementById('_main').getAttribute('data-image');
  }

  fetchImage(dataset) {
    const { color, image } = dataset;

    if (image === this.lastImage) {
      return Observable::empty();
    }

    let res$;
    if (image === '') {
      res$ = Observable::timer(this.duration);
    } else {
      const imgObj = new Image();

      res$ = Observable::fromEvent(imgObj, 'load')
        ::zipWith(Observable::timer(this.duration), x => x)
        ::cleanup(() => { imgObj.src = ''; });

      imgObj.src = image;
    }

    return res$
      ::effect(() => {
        this::updateStyle(dataset);
        this.lastImage = image;
      })
      ::map(() => {
        const div = document.createElement('div');
        div.classList.add('sidebar-bg');
        div.style.backgroundColor = color;
        if (image !== '') div.style.backgroundImage = `url(${image})`;
        return div;
      });
  }

  crossFade([prevDiv, div]) {
    prevDiv.parentNode.insertBefore(div, prevDiv.nextElementSibling);

    return animate(div, [
      { opacity: 0 },
      { opacity: 1 },
    ], {
      duration: this.duration,
      // easing: 'cubic-bezier(0,0,0.32,1)',
    })
    ::cleanup(() => prevDiv.parentNode.removeChild(prevDiv));
  }
}
