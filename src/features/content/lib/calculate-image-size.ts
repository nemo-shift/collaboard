// Image size calculation utility
// 이미지 크기 계산 유틸리티

import { MAX_IMAGE_SIZE } from './constants';

export interface ImageSize {
  width: number;
  height: number;
}

export const calculateImageSize = (
  imgWidth: number,
  imgHeight: number,
  maxWidth: number = MAX_IMAGE_SIZE.width,
  maxHeight: number = MAX_IMAGE_SIZE.height
): ImageSize => {
  let width = imgWidth;
  let height = imgHeight;

  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width, height };
};

