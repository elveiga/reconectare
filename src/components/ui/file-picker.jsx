import React, { useMemo, useRef, useState } from 'react';

const FilePicker = ({
  accept,
  multiple = false,
  onChange,
  buttonLabel = 'Selecionar arquivo',
  emptyLabel = 'Nenhum arquivo selecionado',
  className = '',
  disabled = false
}) => {
  const inputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleChange = (event) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    if (onChange) onChange(event);
  };

  const selectedLabel = useMemo(() => {
    if (!selectedFiles.length) return emptyLabel;
    if (selectedFiles.length === 1) return selectedFiles[0].name;
    return `${selectedFiles.length} arquivos selecionados`;
  }, [selectedFiles, emptyLabel]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="px-3 py-2 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {buttonLabel}
      </button>
      <span className="text-sm text-gray-600 break-all">{selectedLabel}</span>
    </div>
  );
};

export default FilePicker;
