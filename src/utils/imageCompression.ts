/**
 * Compresses an image file to reduce its size while maintaining quality
 * @param file - The original image file
 * @param maxWidth - Maximum width for the compressed image (default: 1200)
 * @param maxHeight - Maximum height for the compressed image (default: 1200)
 * @param quality - Compression quality 0-1 (default: 0.8)
 * @returns Promise<File> - The compressed image file
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Draw and compress the image
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a new File object with the compressed data
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          file.type,
          quality
        )
      } else {
        reject(new Error('Failed to get canvas context'))
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    // Load the image
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Validates if a file is a supported image type
 * @param file - The file to validate
 * @returns boolean - True if the file is a supported image
 */
export function isValidImageFile(file: File): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/jfif',
    'application/octet-stream' // Allow for unusual extensions like .mp.jpg
  ]

  // Also check file extension as backup for MIME type detection issues
  const fileName = file.name.toLowerCase()
  const hasValidExtension = /\.(jpg|jpeg|png|webp|mp\.jpg|jfif)$/i.test(fileName)

  return supportedTypes.includes(file.type.toLowerCase()) || hasValidExtension
}

/**
 * Formats file size in human readable format
 * @param bytes - File size in bytes
 * @returns string - Formatted file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}