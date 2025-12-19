import React, { useState } from 'react';
import { useAdminService } from '../context/AdminServiceContext';
import { X, Save, Upload } from 'lucide-react';

// Initialize Clarifai with admin service proxy
const clarifaiApp = {
  models: {
    predict: async (_modelId: string, imageUrl: string) => {
      const response = await fetch('http://localhost:3002/api/clarifai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageUrl: imageUrl
        })
      });
      return response.json();
    }
  }
};

const GENERAL_MODEL = 'general-image-recognition';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose }) => {
  const { addProduct } = useAdminService();
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    category: '',
    subcategory: '',
    description: '',
    features: [],
    inStock: true,
    isNew: false,
    isBestseller: false,
    images: [],
    colors: [],
    sizes: []
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeImage = async (imageUrl: string) => {
    setIsAnalyzing(true);
    try {
      const response = await clarifaiApp.models.predict(GENERAL_MODEL, imageUrl);
      
      // Check for API errors
      if (response.status && response.status.code !== 10000) {
        throw new Error(response.status.description || 'API Error');
      }
      
      const concepts = response.outputs && response.outputs[0] && response.outputs[0].data && response.outputs[0].data.concepts;
      
      if (concepts && concepts.length > 0) {
        const topConcept = concepts[0];
        setFormData(prev => ({
          ...prev,
          name: topConcept.name || prev.name,
          description: concepts.slice(0, 5).map((c: any) => c.name).join(', ') || prev.description,
          category: topConcept.name.split(' ')[0] || prev.category
        }));
      } else {
        alert('No concepts detected in the image. Please try another image.');
      }
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      alert(`Failed to analyze image: ${error.message || 'Please try again with a valid image URL.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        images: imageUrls
      };
      await addProduct(productData);
      alert('Product added successfully!');
      setFormData({
        name: '',
        price: 0,
        category: '',
        subcategory: '',
        description: '',
        features: [],
        inStock: true,
        isNew: false,
        isBestseller: false,
        images: [],
        colors: [],
        sizes: []
      });
      setImageUrls([]);
      setNewImageUrl('');
      onClose();
    } catch (error) {
      alert('Failed to add product');
      console.error('Add product error:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => handleChange('price', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
            <input
              type="text"
              value={formData.subcategory}
              onChange={(e) => handleChange('subcategory', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
            <div className="space-y-4">
              {/* File Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Upload file to get proper URL
                          const formData = new FormData();
                          formData.append('image', file);
                          
                          try {
                            const uploadResponse = await fetch('http://localhost:3002/api/upload-image', {
                              method: 'POST',
                              body: formData
                            });
                            
                            if (uploadResponse.ok) {
                              const uploadResult = await uploadResponse.json();
                              const imageUrl = uploadResult.imageUrl;
                              setImageUrls([...imageUrls, imageUrl]);
                              
                              // Also analyze the image for auto-fill
                              const analyzeFormData = new FormData();
                              analyzeFormData.append('image', file);
                              
                              const analysisResponse = await fetch('http://localhost:3002/api/clarifai/analyze-file', {
                                method: 'POST',
                                body: analyzeFormData
                              });
                              
                              if (analysisResponse.ok) {
                                const result = await analysisResponse.json();
                                console.log('Analysis result:', result);
                                
                                // Use concepts to fill out product details
                                if (result.outputs && result.outputs[0] && result.outputs[0].data && result.outputs[0].data.concepts) {
                                  const concepts = result.outputs[0].data.concepts;
                                  if (concepts.length > 0) {
                                    const topConcept = concepts[0];
                                    setFormData(prev => ({
                                      ...prev,
                                      name: topConcept.name || prev.name,
                                      description: concepts.slice(0, 5).map((c: any) => c.name).join(', ') || prev.description,
                                      category: topConcept.name.split(' ')[0] || prev.category
                                    }));
                                  }
                                }
                              }
                            } else {
                              alert('Failed to upload image. Please try again.');
                            }
                          } catch (error) {
                            console.error('Upload error:', error);
                            alert('Failed to upload image.');
                          }
                        }
                      }}
                      className="hidden"
                    />
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">Click to upload image</span>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* URL Input Section */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Enter image URL"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (newImageUrl.trim()) {
                      setImageUrls([...imageUrls, newImageUrl.trim()]);
                      await analyzeImage(newImageUrl.trim());
                      setNewImageUrl('');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add URL
                </button>
              </div>

              {/* Image Preview */}
              <div className="flex flex-wrap gap-2">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={url} 
                      alt={`Product image ${index + 1}`}
                      className="w-20 h-20 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Analysis Status */}
              {isAnalyzing && (
                <div className="text-sm text-blue-600">
                  Analyzing image... Please wait.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.inStock}
                onChange={(e) => handleChange('inStock', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">In Stock</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isNew}
                onChange={(e) => handleChange('isNew', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">New Product</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isBestseller}
                onChange={(e) => handleChange('isBestseller', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Bestseller</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
