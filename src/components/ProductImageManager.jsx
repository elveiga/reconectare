import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Crop, Star, Trash2, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getCroppedImageFile } from '@/lib/cropImage';

const buildItemId = (imageUrl, index) => `${index}::${imageUrl}`;

const canUseDOM = typeof document !== 'undefined';

function SortableImageCard({ id, imageUrl, index, onEdit, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative rounded-lg border bg-white overflow-hidden shadow-sm ${
        isDragging ? 'z-10 opacity-80 shadow-lg' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => onEdit(index)}
        className="block w-full text-left"
      >
        <img
          src={imageUrl}
          alt={`Imagem ${index + 1}`}
          className="w-full h-24 object-cover bg-gray-100"
        />
      </button>

      <div className="absolute left-1 top-1 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
        {index === 0 ? <Star className="h-3 w-3 fill-current" /> : null}
        {index === 0 ? 'Principal' : `${index + 1}a`}
      </div>

      <button
        type="button"
        onClick={() => onEdit(index)}
        className="absolute bottom-7 right-1 inline-flex items-center gap-1 rounded bg-white/90 px-2 py-1 text-[10px] font-medium text-gray-900 hover:bg-white"
      >
        <Crop className="h-3 w-3" />
        Recortar
      </button>

      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute right-1 top-1 rounded bg-black/70 p-1 text-white hover:bg-black"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <div className="absolute bottom-1 right-1 inline-flex cursor-grab touch-none items-center gap-1 rounded bg-black/70 px-2 py-1 text-[10px] font-medium text-white active:cursor-grabbing">
        Segure e arraste
      </div>
    </div>
  );
}

export default function ProductImageManager({
  images = [],
  onChange,
  onReplaceImage,
  disabled = false,
  minimumLabel = 'As imagens recortadas sao salvas em 1200x900 para manter o padrao do site.'
}) {
  const { toast } = useToast();
  const [cropModalIndex, setCropModalIndex] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [savingCrop, setSavingCrop] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  const sortableItems = useMemo(
    () => images.map((imageUrl, index) => ({ id: buildItemId(imageUrl, index), imageUrl, index })),
    [images]
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id || disabled) return;

    const oldIndex = sortableItems.findIndex((item) => item.id === active.id);
    const newIndex = sortableItems.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    onChange(arrayMove(images, oldIndex, newIndex));
  };

  const handleRemove = (index) => {
    onChange(images.filter((_, itemIndex) => itemIndex !== index));
  };

  const openCropModal = (index) => {
    setCropModalIndex(index);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const closeCropModal = () => {
    if (savingCrop) return;
    setCropModalIndex(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleSaveCrop = async () => {
    if (cropModalIndex === null || !croppedAreaPixels) {
      toast({
        title: 'Recorte incompleto',
        description: 'Ajuste a imagem antes de salvar o recorte.'
      });
      return;
    }

    try {
      setSavingCrop(true);
      const currentImage = images[cropModalIndex];
      const croppedFile = await getCroppedImageFile(
        currentImage,
        croppedAreaPixels,
        `produto-${cropModalIndex + 1}.jpg`
      );
      await onReplaceImage(cropModalIndex, croppedFile);
      closeCropModal();
      toast({
        title: 'Imagem atualizada',
        description: 'O recorte foi salvo com sucesso.'
      });
    } catch (error) {
      toast({
        title: 'Falha ao recortar imagem',
        description: error?.message || 'Nao foi possivel salvar o recorte.',
        variant: 'destructive'
      });
    } finally {
      setSavingCrop(false);
    }
  };

  return (
    <>
      <p className="text-[11px] text-gray-500 mt-1">
        Arraste para definir a ordem de exibicao. Clique na imagem para recortar.
      </p>
      <p className="text-[11px] text-gray-500 mt-1">{minimumLabel}</p>

      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortableItems.map((item) => item.id)} strategy={rectSortingStrategy}>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {sortableItems.map((item) => (
                <SortableImageCard
                  key={item.id}
                  id={item.id}
                  imageUrl={item.imageUrl}
                  index={item.index}
                  onEdit={openCropModal}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {canUseDOM && cropModalIndex !== null && images[cropModalIndex] && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recortar imagem</h3>
                <p className="text-sm text-gray-500">Formato final 4:3, minimo visual padronizado para o site.</p>
              </div>
              <button
                type="button"
                onClick={closeCropModal}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="relative h-[420px] overflow-hidden rounded-xl bg-gray-950">
                <Cropper
                  image={images[cropModalIndex]}
                  crop={crop}
                  zoom={zoom}
                  aspect={4 / 3}
                  minZoom={1}
                  maxZoom={4}
                  showGrid
                  objectFit="contain"
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                />
              </div>

              <div className="space-y-4 rounded-xl border bg-gray-50 p-4">
                <div>
                  <div className="text-sm font-medium text-gray-900">Zoom do recorte</div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="mt-3 w-full"
                  />
                </div>

                <div className="rounded-lg bg-white p-3 text-sm text-gray-600 shadow-sm">
                  A primeira imagem continua sendo a principal do anuncio.
                </div>

                <div className="rounded-lg bg-white p-3 text-sm text-gray-600 shadow-sm">
                  {minimumLabel}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeCropModal}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={savingCrop}
                    onClick={handleSaveCrop}
                    className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingCrop ? 'Salvando...' : 'Salvar recorte'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
