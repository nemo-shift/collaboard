'use client';

import { supabase } from '@shared/api';
import { logger } from '@shared/lib';

const BUCKET_NAME = 'board-image';

/**
 * 이미지를 Supabase Storage에 업로드
 */
export async function uploadImage(
  file: File,
  boardId: string,
  elementId: string
): Promise<string> {
  // 파일 확장자 추출
  const fileExt = file.name.split('.').pop();
  const fileName = `${boardId}/${elementId}.${fileExt}`;

  // Storage에 업로드
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false, // 기존 파일이 있으면 에러
    });

  if (error) {
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }

  // 버킷이 private이므로 signed URL 생성 (1년 유효)
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(fileName, 31536000); // 1년 (초 단위)

  if (signedUrlError || !signedUrlData?.signedUrl) {
    // signed URL 생성 실패 시 public URL 시도 (버킷이 public인 경우)
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error(`이미지 URL을 가져올 수 없습니다: ${signedUrlError?.message || 'Unknown error'}`);
    }

    return urlData.publicUrl;
  }

  return signedUrlData.signedUrl;
}

/**
 * Storage에서 이미지 삭제
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  // URL에서 파일 경로 추출
  // 예시:
  // - public: https://xxx.supabase.co/storage/v1/object/public/board-image/board-id/element-id.jpg
  // - signed: https://xxx.supabase.co/storage/v1/object/sign/board-image/board-id/element-id.jpg?token=...
  
  // blob URL인 경우 삭제 불가
  if (imageUrl.startsWith('blob:')) {
    return;
  }

  try {
    // URL에서 버킷 이름 이후 경로 추출
    const bucketIndex = imageUrl.indexOf(`/${BUCKET_NAME}/`);
    if (bucketIndex === -1) {
      logger.warn('이미지 URL에서 버킷 경로를 찾을 수 없습니다:', imageUrl);
      return;
    }

    // 버킷 이름 이후 경로 추출 (쿼리 파라미터 제거)
    const pathAfterBucket = imageUrl.substring(bucketIndex + BUCKET_NAME.length + 2);
    const fileName = pathAfterBucket.split('?')[0]; // 쿼리 파라미터 제거

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      logger.warn('이미지 삭제 실패 (무시됨):', error);
      // 삭제 실패해도 에러를 throw하지 않음 (이미 DB에서 삭제된 경우 등)
    }
  } catch (error) {
    logger.warn('이미지 삭제 중 오류 발생 (무시됨):', error);
  }
}


