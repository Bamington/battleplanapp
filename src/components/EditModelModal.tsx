import React, { useState, useEffect } from 'react';
import { X, Upload, Calendar, FileText, Hash, Image as ImageIcon, Package, Gamepad2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { compressImage } from '../utils/imageCompression';
import { ImageCropper } from './ImageCropper';
import { GameDropdown } from './GameDropdown';

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
  notes: string | null;
  image_url: string;
  game_id: string | null;
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
  const [imageForCropping, setImageForCropping] = useState<string | null>(null);
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
        painted_date: (model as any).painted_date || ''
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Model</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
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
                value={model.box?.name || 'No Box (Loose Model)'}
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
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
                <input
                  type="date"
                  value={formData.painted_date}
                  onChange={(e) => setFormData({ ...formData, painted_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
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
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Replace Image */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <ImageIcon className="w-4 h-4 mr-2" />
                Replace Image
              </label>
              
              {/* Current Image Display */}
              {model.image_url && !deleteImage && (
                <div className="mb-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={model.image_url}
                        alt="Current model image"
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Current image</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteImage}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Delete current image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Delete Confirmation */}
              {deleteImage && (
                <div className="mb-3 p-3 border border-red-300 rounded-md bg-red-50 dark:bg-red-900/20">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    ✓ Image will be deleted when you save changes
                  </p>
                </div>
              )}
              
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
              />
              {croppedImageBlob && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  ✓ Cropped image ready for upload ({(croppedImageBlob.size / 1024).toFixed(1)} KB)
                </p>
              )}
              {compressing && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Compressing image...
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-4 h-4 mr-2" />
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Optional notes about this model..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || compressing}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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