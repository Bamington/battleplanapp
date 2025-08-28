import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Calendar, FileText, Hash, Image as ImageIcon, Package, Gamepad2, Trash2, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { compressImage } from '../utils/imageCompression';
import { ImageCropper } from './ImageCropper';
import { GameDropdown } from './GameDropdown';
import { RichTextEditor } from './RichTextEditor';
import { DatePicker } from './DatePicker';


interface Game {
  id: string;
  name: string;
  icon: string | null;
}

interface Model {
  id: string;
  name: string;
  count: number;
  status: string;
  purchase_date: string | null;
  painted_date: string | null;
  notes: string | null;
  image_url: string;
  game_id: string | null;
  box?: {
    id: string;
    name: string;
  } | null;
}

interface EditModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: Model;
  onModelUpdated: () => void;
}

export function EditModelModal({ isOpen, onClose, model, onModelUpdated }: EditModelModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    count: 1,
    purchase_date: '',
    notes: '',
    game_id: '',
    status: '',
    painted_date: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [imageForCropping, setImageForCropping] = useState<File | null>(null);
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [deleteImage, setDeleteImage] = useState(false);

  useEffect(() => {
    if (model) {
      setFormData({
        name: model.name,
        count: model.count,
        purchase_date: model.purchase_date || '',
        notes: model.notes || '',
        game_id: model.game_id || '',
        status: model.status || '',
        painted_date: model.painted_date || ''
      });
    }
  }, [model]);

  useEffect(() => {
    const fetchGames = async () => {
      const { data, error } = await supabase
        .from('games')
        .select('id, name, icon')
        .order('name');

      if (error) {
        console.error('Error fetching games:', error);
      } else {
        setGames(data || []);
      }
    };

    if (isOpen) {
      fetchGames();
    }
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      setSelectedFile(file);
      setImageForCropping(file);
      setShowImageCropper(true);
    }
  };

  const handleCameraCapture = async () => {
    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera is not available on this device');
        return;
      }

      // Try to get camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        } 
      });

      // Create a video element to display the camera feed
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.style.position = 'fixed';
      video.style.top = '0';
      video.style.left = '0';
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.zIndex = '9999';
      video.style.objectFit = 'cover';
      video.style.backgroundColor = '#000';

      // Create canvas for capturing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Create capture button
      const captureBtn = document.createElement('button');
      captureBtn.textContent = '📸 Take Photo';
      captureBtn.style.position = 'fixed';
      captureBtn.style.bottom = '20px';
      captureBtn.style.left = '50%';
      captureBtn.style.transform = 'translateX(-50%)';
      captureBtn.style.zIndex = '10000';
      captureBtn.style.padding = '12px 24px';
      captureBtn.style.backgroundColor = '#007bff';
      captureBtn.style.color = 'white';
      captureBtn.style.border = 'none';
      captureBtn.style.borderRadius = '8px';
      captureBtn.style.fontSize = '16px';
      captureBtn.style.fontWeight = 'bold';
      captureBtn.style.cursor = 'pointer';

      // Create cancel button
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '❌ Cancel';
      cancelBtn.style.position = 'fixed';
      cancelBtn.style.bottom = '20px';
      cancelBtn.style.right = '20px';
      cancelBtn.style.zIndex = '10000';
      cancelBtn.style.padding = '12px 24px';
      cancelBtn.style.backgroundColor = '#dc3545';
      cancelBtn.style.color = 'white';
      cancelBtn.style.border = 'none';
      cancelBtn.style.borderRadius = '8px';
      cancelBtn.style.fontSize = '16px';
      cancelBtn.style.fontWeight = 'bold';
      cancelBtn.style.cursor = 'pointer';

      // Function to capture photo
      const capturePhoto = () => {
        try {
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw the current video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to blob
          canvas.toBlob((blob) => {
            if (blob) {
              // Create a File object from the blob
              const file = new File([blob], `model-photo-${Date.now()}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });

              setSelectedFile(file);
              setImageForCropping(file);
              setShowImageCropper(true);
            }
            
            // Clean up
            cleanup();
          }, 'image/jpeg', 0.9);
        } catch (error) {
          console.error('Error capturing photo:', error);
          alert('Error capturing photo. Please try again.');
          cleanup();
        }
      };

      // Function to cleanup
      const cleanup = () => {
        try {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          if (document.body.contains(video)) {
            document.body.removeChild(video);
          }
          if (document.body.contains(captureBtn)) {
            document.body.removeChild(captureBtn);
          }
          if (document.body.contains(cancelBtn)) {
            document.body.removeChild(cancelBtn);
          }
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      };

      // Add event listeners
      captureBtn.addEventListener('click', capturePhoto);
      cancelBtn.addEventListener('click', cleanup);

      // Add elements to DOM
      document.body.appendChild(video);
      document.body.appendChild(captureBtn);
      document.body.appendChild(cancelBtn);

      // Wait for video to be ready
      video.addEventListener('loadedmetadata', () => {
        console.log('Video ready, dimensions:', video.videoWidth, 'x', video.videoHeight);
      });

      video.addEventListener('error', (e) => {
        console.error('Video error:', e);
        alert('Error loading camera feed. Please try again.');
        cleanup();
      });

    } catch (error) {
      console.error('Error accessing camera:', error);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          alert('Camera access denied. Please allow camera permissions and try again.');
        } else if (error.name === 'NotFoundError') {
          alert('No camera found on this device.');
        } else if (error.name === 'NotReadableError') {
          alert('Camera is already in use by another application.');
        } else {
          alert(`Camera error: ${error.message}`);
        }
      } else {
        alert('Unable to access camera. Please try again or use the file upload option.');
      }
    }
  };

  const handleCroppedImage = async (croppedFile: File) => {
    try {
      setCompressing(true);
      console.log('Original cropped size:', (croppedFile.size / 1024).toFixed(2), 'KB');
      
      const compressedFile = await compressImage(croppedFile, 1200, 1200, 0.8);
      
      console.log('Compressed size:', (compressedFile.size / 1024).toFixed(2), 'KB');
      setCroppedImageBlob(compressedFile);
    } catch (error) {
      console.error('Compression failed, using original cropped image:', error);
      setCroppedImageBlob(croppedFile);
    } finally {
      setCompressing(false);
      setShowImageCropper(false);
    }
  };

  const handleDeleteImage = () => {
    setDeleteImage(true);
    setCroppedImageBlob(null);
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUploading(true);

    try {
      let imageUrl: string | null = model.image_url;

      // Handle image deletion
      if (deleteImage) {
        // Delete the image from storage if it exists and is from our storage
        if (model.image_url && model.image_url.includes('supabase')) {
          try {
            const urlParts = model.image_url.split('/')
            const bucketIndex = urlParts.findIndex(part => part === 'model-images')
            if (bucketIndex !== -1) {
              const filePath = urlParts.slice(bucketIndex + 1).join('/')
              await supabase.storage
                .from('model-images')
                .remove([filePath])
            }
          } catch (deleteError) {
            console.warn('Failed to delete old image:', deleteError)
          }
        }
        imageUrl = null;
      }
      // Upload new image if selected
      else if (croppedImageBlob) {
        // Delete old image if it exists and is from our storage
        if (model.image_url && model.image_url.includes('supabase')) {
          try {
            const urlParts = model.image_url.split('/')
            const bucketIndex = urlParts.findIndex(part => part === 'model-images')
            if (bucketIndex !== -1) {
              const filePath = urlParts.slice(bucketIndex + 1).join('/')
              await supabase.storage
                .from('model-images')
                .remove([filePath])
            }
          } catch (deleteError) {
            console.warn('Failed to delete old image:', deleteError)
          }
        }

        // Upload new image
        const fileExt = selectedFile?.name.split('.').pop() || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('model-images')
          .upload(filePath, croppedImageBlob)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error(`Failed to upload image: ${uploadError.message}`)
        }

        const { data } = supabase.storage
          .from('model-images')
          .getPublicUrl(uploadData.path)

        imageUrl = data.publicUrl
        console.log('New image uploaded:', imageUrl)
      }

      const { error } = await supabase
        .from('models')
        .update({
          name: formData.name,
          count: formData.count,
          purchase_date: formData.purchase_date || null,
          notes: formData.notes || null,
          game_id: formData.game_id || null,
          image_url: imageUrl,
          status: formData.status || 'None',
          painted_date: formData.painted_date || null
        })
        .eq('id', model.id);

      if (error) throw error;

      onModelUpdated();
      onClose();
      
      // Reset form
      setSelectedFile(null);
      setCroppedImageBlob(null);
      setImageForCropping(null);
      setDeleteImage(false);
    } catch (error) {
      console.error('Error updating model:', error);
      alert('Failed to update model. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Model</h2>
          <button
            onClick={onClose}
            className="text-icon hover:text-icon-hover"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {showImageCropper && imageForCropping && (
          <ImageCropper
            isOpen={showImageCropper}
            imageFile={imageForCropping}
            onCrop={handleCroppedImage}
            onClose={() => {
              setShowImageCropper(false);
              setImageForCropping(null);
              setSelectedFile(null);
            }}
          />
        )}

        {!showImageCropper && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Model Name */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-4 h-4 mr-2" />
                Model Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Box - Always visible but read-only in edit mode */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Package className="w-4 h-4 mr-2" />
                Box
              </label>
              <input
                type="text"
                value={model.box?.name || 'No Collection (Loose Model)'}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Box assignment cannot be changed in edit mode.
              </p>
            </div>

            {/* Game - Only show if no box is assigned */}
            {!model.box && (
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Game
                </label>
                <GameDropdown
                  games={games}
                  selectedGame={formData.game_id}
                  onGameSelect={(gameId) => setFormData({ ...formData, game_id: gameId })}
                />
              </div>
            )}

            {/* Painted Status */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-4 h-4 mr-2" />
                Painted Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Status</option>
                <option value="Assembled">Assembled</option>
                <option value="Primed">Primed</option>
                <option value="Partially Painted">Partially Painted</option>
                <option value="Painted">Painted</option>
              </select>
            </div>

            {/* Painted Date - Only show if status is Painted */}
            {formData.status === 'Painted' && (
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  Painted Date
                </label>
                <DatePicker
                  value={formData.painted_date}
                  onChange={(date) => setFormData({ ...formData, painted_date: date })}
                  placeholder="Select painted date"
                  minDate=""
                />
              </div>
            )}

            {/* Purchase Date - Only show if no box is assigned */}
            {!model.box && (
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  Purchase Date
                </label>
                <DatePicker
                  value={formData.purchase_date}
                  onChange={(date) => setFormData({ ...formData, purchase_date: date })}
                  placeholder="Select purchase date"
                  minDate=""
                />
              </div>
            )}

            {/* Number of Models */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Hash className="w-4 h-4 mr-2" />
                Number of Models
              </label>
              <input
                type="number"
                min="1"
                value={formData.count}
                onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Model Image */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-input-label font-overpass">
                  Model Image
                </label>
                <span className="text-sm text-gray-500">Optional</span>
              </div>
              
              {/* Image Upload Area */}
              <div className="border-2 border-dashed border-border-custom rounded-lg p-6 text-center hover:border-[var(--color-brand)] transition-colors">
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="relative mx-auto w-32 h-32">
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Selected model image"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null)
                          setCroppedImageBlob(null)
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-secondary-text">{selectedFile.name}</p>
                  </div>
                ) : model.image_url && !deleteImage ? (
                  <div className="space-y-4">
                    <div className="relative mx-auto w-32 h-32">
                      <img
                        src={model.image_url}
                        alt="Current model image"
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleDeleteImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Remove current image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-secondary-text">Current image</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center space-x-4">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={uploading}
                        />
                        <div className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-bg-secondary transition-colors">
                          <ImageIcon className="w-8 h-8 text-icon" />
                          <span className="text-sm font-medium text-text">Upload Image</span>
                        </div>
                      </label>
                      
                      <button
                        type="button"
                        onClick={handleCameraCapture}
                        disabled={uploading}
                        className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-bg-secondary transition-colors"
                      >
                        <Camera className="w-8 h-8 text-icon" />
                        <span className="text-sm font-medium text-text">Take Photo</span>
                      </button>
                    </div>
                    <p className="text-xs text-secondary-text">
                      JPEG, PNG, or WebP up to 50MB
                    </p>
                  </div>
                )}
              </div>

              {/* Status Messages */}
              {croppedImageBlob && (
                <p className="text-green-600 text-sm mt-2">
                  ✓ Cropped image ready for upload ({(croppedImageBlob.size / 1024).toFixed(1)} KB)
                </p>
              )}
              
              {compressing && (
                <p className="text-blue-600 text-sm mt-2">Compressing image...</p>
              )}
              
              {deleteImage && (
                <p className="text-red-600 text-sm mt-2">
                  ✓ Image will be deleted when you save changes
                </p>
              )}
            </div>

            {/* Notes */}
            <RichTextEditor
              value={formData.notes}
              onChange={(value) => setFormData({ ...formData, notes: value })}
              placeholder="Optional notes about this model..."
              label="Notes"
              rows={4}
            />

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost btn-flex"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || compressing}
                className="btn-primary btn-flex"
              >
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Model'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}