import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Calendar, FileText, Hash, Image as ImageIcon, Package, Gamepad2, Trash2, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useGames } from '../hooks/useGames';
import { useRecentGames } from '../hooks/useRecentGames';
import { compressImage, isValidImageFile } from '../utils/imageCompression';
import { ImageCropper } from './ImageCropper';
import { GameDropdown } from './GameDropdown';
import { AddNewGameModal } from './AddNewGameModal';
import { RichTextEditor } from './RichTextEditor';
import { DatePicker } from './DatePicker';



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
  images?: {
    id: string;
    model_id: string;
    image_url: string;
    display_order: number;
    is_primary: boolean;
    created_at: string;
    user_id: string;
  }[];
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
  const { games, createGame, refetch: refetchGames } = useGames();
  const { addRecentGame } = useRecentGames();
  const [deleteImage, setDeleteImage] = useState(false);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  
  // Multiple images state
  const [modelImages, setModelImages] = useState<{
    id: string;
    model_id: string;
    image_url: string;
    display_order: number;
    is_primary: boolean;
    created_at: string;
    user_id: string;
  }[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [newImagesToUpload, setNewImagesToUpload] = useState<{
    file: File;
    blob: Blob;
    display_order: number;
  }[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch model images from the database
  const fetchModelImages = async () => {
    if (!model?.id) return

    try {
      const { data, error } = await supabase
        .from('model_images')
        .select('*')
        .eq('model_id', model.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching model images:', error)
        setModelImages([])
      } else {
        const images = data || []

        // Reorder images: primary first, then rest by creation date
        const primaryImage = images.find(img => img.is_primary)
        const nonPrimaryImages = images.filter(img => !img.is_primary).sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

        const orderedImages = primaryImage ? [primaryImage, ...nonPrimaryImages] : nonPrimaryImages
        setModelImages(orderedImages)
      }
    } catch (error) {
      console.error('Error fetching model images:', error)
      setModelImages([])
    }
  }

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

      // Fetch images from database instead of relying on model.images
      fetchModelImages();
      setImagesToDelete([]);
      setNewImagesToUpload([]);
    }
  }, [model]);

  const handleGameSelect = async (gameId: string) => {
    // Handle custom game creation
    if (gameId.startsWith('new:')) {
      const gameName = gameId.replace('new:', '')
      try {
        setLoading(true)

        // Create the custom game using the hook
        const newGame = await createGame(gameName)

        // Set the new game as selected
        setFormData({ ...formData, game_id: newGame.id })

        // Add to recent games
        addRecentGame(newGame)

        console.log('Created custom game:', newGame)
      } catch (err) {
        console.error('Failed to create custom game:', err)
        // You could add an error state if needed
      } finally {
        setLoading(false)
      }
    } else {
      // Handle existing games
      setFormData({ ...formData, game_id: gameId })
      // Add to recent games
      const selectedGameData = games.find(game => game.id === gameId)
      if (selectedGameData) {
        addRecentGame(selectedGameData)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    e.target.value = ''; // Clear input to allow re-selecting same files
  };

  const processFiles = (files: File[]) => {
    if (files.length === 0) return;
    
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    const validFiles: File[] = [];
    
    for (const file of files) {
      // Validate file type using the proper validation function
      if (!isValidImageFile(file)) {
        alert(`Invalid file: ${file.name}. Please select valid image files (JPEG, PNG, or WebP).`);
        return;
      }
      
      if (file.size > maxSize) {
        alert(`File too large: ${file.name}. Maximum size is 50MB.`);
        return;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      // Always show cropper for the first image
      setSelectedFile(validFiles[0]);
      setImageForCropping(validFiles[0]);
      setShowImageCropper(true);

      // If there are additional files, add them directly without cropping
      if (validFiles.length > 1) {
        const additionalFiles = validFiles.slice(1);
        additionalFiles.forEach(file => {
          compressImage(file, 1200, 1200, 0.8).then(compressedFile => {
            addNewImage(file, compressedFile);
          }).catch(() => {
            // If compression fails, use original file
            addNewImage(file, file);
          });
        });
      }
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
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

              // Always show cropper for camera captures
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
      
      // Add to new images to upload
      addNewImage(croppedFile, compressedFile);
      
      // Clear the single image state
      setCroppedImageBlob(null);
      setSelectedFile(null);
    } catch (error) {
      console.error('Compression failed, using original cropped image:', error);
      addNewImage(croppedFile, croppedFile);
      setCroppedImageBlob(null);
      setSelectedFile(null);
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

  // Helper functions for multiple images
  const addNewImage = (file: File, blob: Blob) => {
    const nextOrder = Math.max(0, ...modelImages.map(img => img.display_order), ...newImagesToUpload.map(img => img.display_order)) + 1;
    setNewImagesToUpload(prev => [...prev, { file, blob, display_order: nextOrder }]);
  };

  const removeNewImage = (index: number) => {
    setNewImagesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const deleteExistingImage = (imageId: string) => {
    setImagesToDelete(prev => [...prev, imageId]);
    setModelImages(prev => prev.filter(img => img.id !== imageId));
  };

  const setPrimaryImage = (imageId: string) => {
    setModelImages(prev => prev.map(img => ({
      ...img,
      is_primary: img.id === imageId
    })));
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    const newImages = [...modelImages];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    
    // Update display_order
    const updatedImages = newImages.map((img, index) => ({
      ...img,
      display_order: index
    }));
    
    setModelImages(updatedImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUploading(true);

    try {
      // Handle multiple images
      let primaryImageUrl: string | null = model.image_url;

      // 1. Delete images marked for deletion
      for (const imageId of imagesToDelete) {
        const imageToDelete = model.images?.find(img => img.id === imageId);
        if (imageToDelete?.image_url && imageToDelete.image_url.includes('supabase')) {
          try {
            const urlParts = imageToDelete.image_url.split('/')
            const bucketIndex = urlParts.findIndex(part => part === 'model-images')
            if (bucketIndex !== -1) {
              const filePath = urlParts.slice(bucketIndex + 1).join('/')
              await supabase.storage
                .from('model-images')
                .remove([filePath])
            }
          } catch (deleteError) {
            console.warn('Failed to delete image:', deleteError)
          }
        }
        
        // Delete from database
        await supabase
          .from('model_images')
          .delete()
          .eq('id', imageId)
      }

      // 2. Upload new images
      const uploadedImages = [];
      for (const newImage of newImagesToUpload) {
        const fileExt = newImage.file.name.split('.').pop() || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('model-images')
          .upload(filePath, newImage.blob)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error(`Failed to upload image: ${uploadError.message}`)
        }

        const { data } = supabase.storage
          .from('model-images')
          .getPublicUrl(uploadData.path)

        // Insert into model_images table
        const { data: imageData, error: imageError } = await supabase
          .from('model_images')
          .insert({
            model_id: model.id,
            image_url: data.publicUrl,
            display_order: newImage.display_order,
            is_primary: false, // Will be set below
            user_id: user.id
          })
          .select()
          .single()

        if (imageError) {
          console.error('Error inserting image record:', imageError)
          throw new Error(`Failed to save image record: ${imageError.message}`)
        }

        uploadedImages.push(imageData)
      }

      // 3. Update display_order for existing images
      for (let i = 0; i < modelImages.length; i++) {
        const image = modelImages[i]
        await supabase
          .from('model_images')
          .update({ display_order: i })
          .eq('id', image.id)
      }

      // 4. Set primary image
      const allImages = [...modelImages, ...uploadedImages]
      const primaryImage = allImages.find(img => img.is_primary)

      if (primaryImage) {
        // First, clear all primary flags
        await supabase
          .from('model_images')
          .update({ is_primary: false })
          .eq('model_id', model.id)

        // Then set the selected image as primary
        await supabase
          .from('model_images')
          .update({ is_primary: true })
          .eq('id', primaryImage.id)

        primaryImageUrl = primaryImage.image_url
      } else if (allImages.length > 0) {
        // If no primary image set, make the first one primary
        const firstImage = allImages[0]

        // Clear all primary flags first
        await supabase
          .from('model_images')
          .update({ is_primary: false })
          .eq('model_id', model.id)

        // Set first image as primary
        await supabase
          .from('model_images')
          .update({ is_primary: true })
          .eq('id', firstImage.id)

        primaryImageUrl = firstImage.image_url
      }

      // Handle new game creation and other option
      let gameIdToSave = formData.game_id || null
      
      // Find the 'Other' game to check if selected game is the 'Other' option
      const otherGame = games.find(game => game.name.toLowerCase() === 'other')
      
      if (formData.game_id === otherGame?.id) {
        gameIdToSave = null
      } else if (formData.game_id && formData.game_id.startsWith('new:')) {
        const gameName = formData.game_id.replace('new:', '')
        const newGame = await createGame(gameName)
        gameIdToSave = newGame.id
        // Add to recent games
        addRecentGame(newGame)
      }

      const { error } = await supabase
        .from('models')
        .update({
          name: formData.name,
          count: formData.count,
          purchase_date: formData.purchase_date || null,
          notes: formData.notes || null,
          game_id: gameIdToSave,
          image_url: primaryImageUrl,
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
      setNewImagesToUpload([]);
      setImagesToDelete([]);
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
              <>
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Gamepad2 className="w-4 h-4 mr-2" />
                    Game
                  </label>
                  <GameDropdown
                    games={games}
                    selectedGame={formData.game_id}
                    onGameSelect={handleGameSelect}
                    showAddNewButton={true}
                  />
                </div>
                
              </>
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

            {/* Purchase Date - Show editable field if no box, or disabled field if box has purchase date */}
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
            
            {/* Purchase Date - Show disabled field when box has purchase date */}
            {model.box && model.box.purchase_date && (
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  Purchase Date
                </label>
                <input
                  type="text"
                  value={new Date(model.box.purchase_date).toLocaleDateString('en-AU')}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  We'll use the collection's purchase date.
                </p>
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
              
              {/* Multiple Images Gallery */}
              <div className="space-y-4">
                {/* Existing Images */}
                {modelImages.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-text">Current Images</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {modelImages.map((image, index) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.image_url}
                            alt={`Model image ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 flex space-x-2 transition-opacity">
                              <button
                                type="button"
                                onClick={() => setPrimaryImage(image.id)}
                                className={`p-1 rounded-full ${
                                  image.is_primary 
                                    ? 'bg-yellow-500 text-white' 
                                    : 'bg-white text-gray-700 hover:bg-yellow-100'
                                }`}
                                title={image.is_primary ? 'Primary image' : 'Set as primary'}
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteExistingImage(image.id)}
                                className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                title="Delete image"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {image.is_primary && (
                            <div className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                              Primary
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images to Upload */}
                {newImagesToUpload.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-text">New Images</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {newImagesToUpload.map((newImage, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(newImage.file)}
                            alt={`New image ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                            title="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Controls */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive 
                      ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/5' 
                      : 'border-border-custom hover:border-[var(--color-brand)]'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {dragActive && (
                    <div className="mb-4">
                      <p className="text-lg font-medium text-[var(--color-brand)]">Drop images here</p>
                    </div>
                  )}
                  
                  <div className="flex justify-center space-x-4">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploading}
                      />
                      <div className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-bg-secondary transition-colors">
                        <ImageIcon className="w-8 h-8 text-icon" />
                        <span className="text-sm font-medium text-text">Add Images</span>
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
                  <p className="text-xs text-secondary-text mt-2">
                    {dragActive ? 'Drop multiple images here' : 'JPEG, PNG, or WebP up to 50MB each. Drag & drop or click to select multiple images.'}
                  </p>
                </div>
              </div>

              {/* Status Messages */}
              {compressing && (
                <p className="text-blue-600 text-sm mt-2">Compressing image...</p>
              )}
              
              {newImagesToUpload.length > 0 && (
                <p className="text-green-600 text-sm mt-2">
                  ✓ {newImagesToUpload.length} new image{newImagesToUpload.length > 1 ? 's' : ''} ready for upload
                </p>
              )}
              
              {imagesToDelete.length > 0 && (
                <p className="text-red-600 text-sm mt-2">
                  ⚠️ {imagesToDelete.length} image{imagesToDelete.length > 1 ? 's' : ''} will be deleted when you save changes
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
        
        <AddNewGameModal
          isOpen={showAddGameModal}
          onClose={() => setShowAddGameModal(false)}
          onGameCreated={async (newGame) => {
            setFormData({ ...formData, game_id: newGame.id })
            addRecentGame(newGame)
            // Refetch games to ensure all components see the new game
            await refetchGames()
            setShowAddGameModal(false)
          }}
        />
      </div>
    </div>
  );
}