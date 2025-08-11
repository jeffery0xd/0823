import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const ProductImageDownloader = () => {
  const [file, setFile] = useState(null);
  const [products, setProducts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [processingOptions, setProcessingOptions] = useState({
    pricePosition: 'bottom-right',
    priceColor: '#ff0909',
    fontSize: 186.9,
    logoPosition: 'none',
    fontFamily: 'Barlow Condensed',
    fontWeight: '800',
    fontStyle: 'italic',
    strokeColor: '#fee660',
    strokeWidth: 6,
    useGradient: false,
    gradientColor: '#fee660'
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoImage, setLogoImage] = useState(null);
  const [isGenerating9Grid, setIsGenerating9Grid] = useState(false);
  const [isGeneratingSingle, setIsGeneratingSingle] = useState(false);
  const [generateNineGrid, setGenerateNineGrid] = useState(false);
  const [template, setTemplate] = useState(null);
  const [templatePreview, setTemplatePreview] = useState(null);
  const [useTemplate, setUseTemplate] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const logoInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleTemplateUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        addLog('⚠️ 请上传图片格式的模板文件');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        addLog('⚠️ 模板文件大小不能超过10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          if (img.width !== 800 || img.height !== 800) {
            addLog('⚠️ 模板图片必须是 800x800 像素');
            return;
          }
          
          setTemplate(file);
          setTemplatePreview(e.target.result);
          addLog('✓ 模板上传成功！');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const removeTemplate = () => {
    setTemplate(null);
    setTemplatePreview(null);
    setUseTemplate(false);
    addLog('✓ 模板已移除');
  };

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.toLowerCase().endsWith('.xlsx')) {
      alert('请上传Excel文件(.xlsx格式)');
      return;
    }

    setFile(uploadedFile);
    setLogs([]);
    setProducts([]);
    addLog('文件上传成功，开始解析...');
    parseExcelFile(uploadedFile);
  };

  const parseExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        addLog(`解析Excel文件成功，共${jsonData.length}行数据`);

        const processedProducts = [];
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          let spu = row['商品spu'] || '';
          let price = row['商品售价*'] || '';
          const imageUrls = row['商品图片*'] || '';
          
          if (!price && i + 1 < jsonData.length) {
            price = jsonData[i + 1]['商品售价*'] || '';
            addLog(`SPU ${spu} 价格为空，使用下一行价格: ${price}`);
          }
          
          spu = String(spu).trim();
          price = String(price).trim();
          
          if (price && !isNaN(parseFloat(price))) {
            price = Math.floor(parseFloat(price)).toString();
          }
          
          const imageList = imageUrls.split(',').map(url => url.trim()).filter(url => url);
          const firstImageUrl = imageList[0] || '';

          if (spu && price && firstImageUrl) {
            processedProducts.push({
              id: processedProducts.length + 1,
              spu,
              price,
              imageUrls: imageList,
              firstImageUrl,
              filename: `${price}-${spu}.png`,
              status: 'pending'
            });
          }
        }

        setProducts(processedProducts);
        addLog(`找到${processedProducts.length}个有效产品数据`);
      } catch (error) {
        console.error('Excel解析错误:', error);
        addLog(`Excel解析失败: ${error.message}`);
        alert('Excel文件解析失败，请检查文件格式');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const generateSingleImages = async () => {
    if (products.length === 0) {
      alert('请先上传并解析Excel文件');
      return;
    }

    setIsGeneratingSingle(true);
    addLog('开始生成单图...');
    
    const zip = new JSZip();
    let successCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      try {
        addLog(`正在处理: ${product.spu}`);
        
        const processedBlob = await new Promise((resolve, reject) => {
          const img = new Image();
          
          const timeout = setTimeout(() => {
            reject(new Error('图片加载超时'));
          }, 10000);
          
          img.onload = () => {
            clearTimeout(timeout);
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              canvas.width = 800;
              canvas.height = 800;
              
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, 800, 800);
              
              const scale = Math.min(800 / img.width, 800 / img.height);
              const scaledWidth = img.width * scale;
              const scaledHeight = img.height * scale;
              
              const x = (800 - scaledWidth) / 2;
              const y = (800 - scaledHeight) / 2;
              
              ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
              
              if (useTemplate && templatePreview) {
                const templateImg = new Image();
                templateImg.src = templatePreview;
                ctx.drawImage(templateImg, 0, 0, 800, 800);
              }
              
              if (processingOptions.pricePosition && processingOptions.pricePosition !== 'none') {
                const priceText = `MX$${product.price}`;
                const fontSize = processingOptions.fontSize;
                
                const fontWeight = processingOptions.fontWeight || 'bold';
                const fontStyle = processingOptions.fontStyle || 'normal';
                const fontFamily = processingOptions.fontFamily || 'Arial';
                ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
                
                const textMetrics = ctx.measureText(priceText);
                const textWidth = textMetrics.width;
                const margin = 15;
                let xPos, yPos;
                
                switch (processingOptions.pricePosition) {
                  case 'top-left':
                    xPos = margin;
                    yPos = margin + fontSize;
                    break;
                  case 'top-right':
                    xPos = 800 - textWidth - margin;
                    yPos = margin + fontSize;
                    break;
                  case 'bottom-left':
                    xPos = margin;
                    yPos = 800 - margin;
                    break;
                  case 'bottom-right':
                    xPos = 800 - textWidth - margin;
                    yPos = 800 - margin;
                    break;
                }
                
                if (processingOptions.strokeWidth > 0) {
                  ctx.strokeStyle = processingOptions.strokeColor || '#FFFFFF';
                  ctx.lineWidth = processingOptions.strokeWidth;
                  ctx.lineJoin = 'round';
                  ctx.miterLimit = 2;
                  ctx.strokeText(priceText, xPos, yPos);
                }
                
                if (processingOptions.useGradient && processingOptions.gradientColor) {
                  const gradient = ctx.createLinearGradient(xPos, yPos - fontSize, xPos, yPos);
                  gradient.addColorStop(0, processingOptions.priceColor);
                  gradient.addColorStop(1, processingOptions.gradientColor);
                  ctx.fillStyle = gradient;
                } else {
                  ctx.fillStyle = processingOptions.priceColor;
                }
                
                ctx.fillText(priceText, xPos, yPos);
              }
              
              canvas.toBlob(resolve, 'image/png', 0.9);
            } catch (error) {
              reject(error);
            }
          };
          
          img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('图片加载失败'));
          };
          
          img.crossOrigin = 'anonymous';
          img.src = product.firstImageUrl;
        });
        
        const filename = `${product.price}-${product.spu}.png`;
        zip.file(filename, processedBlob);
        successCount++;
        addLog(`✓ 生成成功: ${filename}`);
        
      } catch (error) {
        addLog(`✗ 生成失败: ${product.spu} - ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (successCount > 0) {
      const content = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      saveAs(content, `product-images-${timestamp}.zip`);
      addLog(`✓ 图片生成完成！成功生成 ${successCount} 张图片`);
    }
    
    setIsGeneratingSingle(false);
  };

  const resetAll = () => {
    setFile(null);
    setProducts([]);
    setIsProcessing(false);
    setProgress(0);
    setLogs([]);
    setLogoFile(null);
    setLogoImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
    addLog('系统已重置');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">产品图片批量下载</h2>
            <p className="text-gray-600">上传Excel文件，批量下载产品图片并打包</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => setShowTemplateManager(!showTemplateManager)}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              🎨 模板管理
            </button>
          </div>
        </div>
      </div>

      {showTemplateManager && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">🎨 模板管理</h3>
            <button
              onClick={() => setShowTemplateManager(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">📝 上传模板</h4>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleTemplateUpload}
                  className="hidden"
                  id="template-upload"
                />
                <label
                  htmlFor="template-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-600">点击上传 800x800 PNG 模板</span>
                  <span className="text-xs text-gray-400">支持 PNG、JPG 格式，最大 10MB</span>
                </label>
              </div>

              {templatePreview && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="use-template"
                      checked={useTemplate}
                      onChange={(e) => setUseTemplate(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="use-template" className="text-sm text-gray-700">
                      在下载时应用模板
                    </label>
                  </div>
                  <button
                    onClick={removeTemplate}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    🗑️ 移除模板
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">👁️ 模板预览</h4>
              <div className="border rounded-lg p-4 bg-gray-50">
                {templatePreview ? (
                  <div className="space-y-3">
                    <img
                      src={templatePreview}
                      alt="模板预览"
                      className="w-full max-w-xs mx-auto rounded-lg shadow-md"
                    />
                    <div className="text-center text-sm text-gray-600">
                      <p>✅ 模板已上传 {useTemplate ? '(已启用)' : '(未启用)'}</p>
                      <p className="text-xs text-gray-500">800x800 像素</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p>暂无模板</p>
                    <p className="text-xs">上传 800x800 像素的 PNG 模板</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">文件上传</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Excel文件</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  选择Excel文件
                </button>
                {file && (
                  <p className="text-sm text-gray-600 mt-2">
                    已选择: {file.name}
                  </p>
                )}
              </div>
              
              {products.length > 0 && (
                <div className="border-t pt-4 space-y-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">价格标签设置</h4>
                  
                  <div className="bg-gradient-to-r from-red-500 to-yellow-500 text-white p-3 rounded-lg">
                    <p className="text-sm font-bold">🎨 艺术字体样式</p>
                    <p className="text-xs opacity-90">Barlow Condensed ExtraBold Italic</p>
                    <p className="text-xs opacity-90">#ff0909 颜色 • 186.9px 大小 • 6px 描边</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">标签位置</label>
                    <select
                      value={processingOptions.pricePosition}
                      onChange={(e) => setProcessingOptions(prev => ({...prev, pricePosition: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="none">不显示</option>
                      <option value="top-left">左上角</option>
                      <option value="top-right">右上角</option>
                      <option value="bottom-left">左下角</option>
                      <option value="bottom-right">右下角</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">字体大小</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        min="24"
                        max="200"
                        step="0.1"
                        value={processingOptions.fontSize}
                        onChange={(e) => setProcessingOptions(prev => ({...prev, fontSize: parseFloat(e.target.value)}))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="24"
                        max="200"
                        step="0.1"
                        value={processingOptions.fontSize}
                        onChange={(e) => setProcessingOptions(prev => ({...prev, fontSize: parseFloat(e.target.value)}))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500">px</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        id="use-gradient"
                        checked={processingOptions.useGradient}
                        onChange={(e) => setProcessingOptions(prev => ({...prev, useGradient: e.target.checked}))}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="use-gradient" className="text-sm font-medium text-gray-700">渐变效果</label>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">文字颜色</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={processingOptions.priceColor}
                            onChange={(e) => setProcessingOptions(prev => ({...prev, priceColor: e.target.value}))}
                            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={processingOptions.priceColor}
                            onChange={(e) => setProcessingOptions(prev => ({...prev, priceColor: e.target.value}))}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      {processingOptions.useGradient && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">渐变色</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={processingOptions.gradientColor}
                              onChange={(e) => setProcessingOptions(prev => ({...prev, gradientColor: e.target.value}))}
                              className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={processingOptions.gradientColor}
                              onChange={(e) => setProcessingOptions(prev => ({...prev, gradientColor: e.target.value}))}
                              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">描边设置</label>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">描边粗细</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="0"
                            max="20"
                            value={processingOptions.strokeWidth}
                            onChange={(e) => setProcessingOptions(prev => ({...prev, strokeWidth: parseInt(e.target.value)}))}
                            className="flex-1"
                          />
                          <span className="text-xs text-gray-500 w-8">{processingOptions.strokeWidth}px</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">描边颜色</label>
                        <input
                          type="color"
                          value={processingOptions.strokeColor}
                          onChange={(e) => setProcessingOptions(prev => ({...prev, strokeColor: e.target.value}))}
                          className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {products.length > 0 && (
              <div className="space-y-3">
                <button
                  onClick={generateSingleImages}
                  disabled={isGeneratingSingle}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  {isGeneratingSingle ? '生成中...' : '生成并下载图片'}
                </button>
                
                <button
                  onClick={resetAll}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  重置
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">处理日志</h3>
            <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-sm">等待操作...</p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono text-gray-700">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {products.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">产品列表 ({products.length})</h3>
              <div className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {products.slice(0, 10).map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{product.spu}</p>
                        <p className="text-sm text-gray-600">MX${product.price}</p>
                      </div>
                      <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={product.firstImageUrl}
                          alt={product.spu}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {products.length > 10 && (
                    <div className="text-center py-2 text-gray-500 text-sm">
                      还有 {products.length - 10} 个产品...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductImageDownloader;