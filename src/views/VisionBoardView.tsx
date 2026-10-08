import React, { useState } from 'react';
import { AppState, VisionBoard, VisionBoardItem } from '../types';
import { sound } from '../audio';
import { toast } from '../toast';

interface VisionBoardViewProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
}

const PRESET_IMAGES = [
  { label: 'Morning Light', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
  { label: 'Mountain Dawn', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80' },
  { label: 'Calm Waters', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Rose Blossoms', url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80' },
  { label: 'Golden Hour Sky', url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=800&q=80' },
  { label: 'Starry Sky', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80' },
];

export const VisionBoardView: React.FC<VisionBoardViewProps> = ({ state, onUpdateState }) => {
  const [selectedBoardId, setSelectedBoardId] = useState(state.visionBoards[0]?.id || 'vb_main');
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [itemType, setItemType] = useState<'text' | 'affirmation' | 'goal' | 'image'>('text');
  const [itemContent, setItemContent] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemColor, setItemColor] = useState('var(--pri)');

  const currentBoard = state.visionBoards.find(b => b.id === selectedBoardId) || state.visionBoards[0];

  const handleCreateBoard = () => {
    const title = newBoardTitle.trim();
    if (!title) return;

    const newBoard: VisionBoard = {
      id: `vb_${Date.now()}`,
      title,
      items: [
        { id: `vbi_${Date.now()}`, type: 'affirmation', content: 'Everything is unfolding with divine timing.', color: '#b03a62' },
      ],
      updatedAt: new Date().toISOString(),
    };

    onUpdateState(prev => ({
      ...prev,
      visionBoards: [newBoard, ...prev.visionBoards],
    }));

    setSelectedBoardId(newBoard.id);
    setNewBoardTitle('');
    sound.playChime(528, 1.5);
  };

  const handleAddItem = () => {
    if (!itemContent.trim() && !itemImageUrl.trim()) return;

    const newItem: VisionBoardItem = {
      id: `vbi_${Date.now()}`,
      type: itemType,
      content: itemContent.trim(),
      imageUrl: itemType === 'image' ? (itemImageUrl.trim() || PRESET_IMAGES[0].url) : undefined,
      color: itemColor,
    };

    onUpdateState(prev => ({
      ...prev,
      visionBoards: prev.visionBoards.map(b =>
        b.id === currentBoard.id ? { ...b, items: [...b.items, newItem], updatedAt: new Date().toISOString() } : b
      ),
    }));

    setItemContent('');
    setItemImageUrl('');
    sound.playChime(432, 1.2);
  };

  const handleDeleteItem = (itemId: string) => {
    onUpdateState(prev => ({
      ...prev,
      visionBoards: prev.visionBoards.map(b =>
        b.id === currentBoard.id ? { ...b, items: b.items.filter(it => it.id !== itemId) } : b
      ),
    }));
  };

  const handleDeleteBoard = (boardId: string) => {
    if (state.visionBoards.length <= 1) {
      toast('You must keep at least one vision board in your sanctuary.');
      return;
    }
    if (!confirm('Are you sure you want to delete this vision board?')) return;

    onUpdateState(prev => {
      const remaining = prev.visionBoards.filter(b => b.id !== boardId);
      return { ...prev, visionBoards: remaining };
    });
    setSelectedBoardId(state.visionBoards.find(b => b.id !== boardId)?.id || '');
  };

  const handleExportBoard = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentBoard, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentBoard.title.toLowerCase().replace(/\s+/g, '-')}-vision-board.json`);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <>
      <div className="card in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2>🖼️ Vision Board Builder</h2>
            <p className="small" style={{ margin: '2px 0 0' }}>
              Weave intentions, vivid imagery, and goals into a visual manifestation tapestry.
            </p>
          </div>
          <div className="acts" style={{ margin: 0 }}>
            <button className="btn" onClick={handleExportBoard}>
              📤 Export Board JSON
            </button>
          </div>
        </div>

        {/* Board selector and create bar */}
        <div className="row" style={{ marginTop: 14, alignItems: 'center' }}>
          <select
            value={selectedBoardId}
            onChange={e => setSelectedBoardId(e.target.value)}
            style={{ flex: '1 1 200px' }}
          >
            {state.visionBoards.map(b => (
              <option key={b.id} value={b.id}>{b.title} ({b.items.length} cards)</option>
            ))}
          </select>

          <input
            placeholder="New board title..."
            value={newBoardTitle}
            onChange={e => setNewBoardTitle(e.target.value)}
            style={{ flex: '1 1 180px' }}
          />
          <button className="btn p" onClick={handleCreateBoard} disabled={!newBoardTitle.trim()}>
            + Create Board
          </button>
          {state.visionBoards.length > 1 && (
            <button
              className="btn"
              style={{ color: '#ff4fa3' }}
              onClick={() => handleDeleteBoard(currentBoard.id)}
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>

      {/* Add Item form */}
      <div className="card in">
        <h3 style={{ margin: '0 0 10px' }}>+ Add to "{currentBoard.title}"</h3>
        <div className="row">
          <select value={itemType} onChange={e => setItemType(e.target.value as any)}>
            <option value="text">✨ Intention / Note</option>
            <option value="affirmation">💫 Affirmation</option>
            <option value="goal">🎯 Milestone Goal</option>
            <option value="image">🖼️ Visual Image</option>
          </select>

          {itemType === 'image' ? (
            <div style={{ flex: '2 1 280px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                placeholder="Image URL or choose preset below"
                value={itemImageUrl}
                onChange={e => setItemImageUrl(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PRESET_IMAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn"
                    style={{ padding: '2px 6px', fontSize: '0.72em' }}
                    onClick={() => {
                      setItemImageUrl(preset.url);
                      setItemContent(preset.label);
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <input
              placeholder={
                itemType === 'affirmation'
                  ? 'Type an empowering affirmation...'
                  : itemType === 'goal'
                  ? 'Define a concrete milestone...'
                  : 'Write a grounding thought or intention...'
              }
              value={itemContent}
              onChange={e => setItemContent(e.target.value)}
              style={{ flex: '2 1 280px' }}
            />
          )}

          <button className="btn p" onClick={handleAddItem}>
            Pin to Board 📌
          </button>
        </div>
      </div>

      {/* Vision Board Grid */}
      <div className="card in" style={{ padding: '20px', minHeight: 380, background: 'rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>{currentBoard.title}</h3>
          <span className="small">{currentBoard.items.length} Elements</span>
        </div>

        {currentBoard.items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.75 }}>
            <p>This board is empty. Add your first intention, affirmation, or image above.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '14px',
            }}
          >
            {currentBoard.items.map(item => (
              <div
                key={item.id}
                className="card"
                style={{
                  margin: 0,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: 'color-mix(in srgb, var(--card) 90%, var(--pri))',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span className="eyebrow" style={{ fontSize: '0.68em' }}>
                      {item.type.toUpperCase()}
                    </span>
                    <button
                      className="btn"
                      style={{ padding: '2px 6px', fontSize: '0.7em', border: 'none' }}
                      onClick={() => handleDeleteItem(item.id)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>

                  {item.type === 'image' && item.imageUrl && (
                    <div style={{ borderRadius: 6, overflow: 'hidden', marginBottom: 8, height: 160, background: '#000' }}>
                      <img
                        src={item.imageUrl}
                        alt={item.content || 'Vision board element'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    </div>
                  )}

                  <p
                    style={{
                      margin: '4px 0',
                      fontSize: item.type === 'affirmation' ? '1.1em' : '0.98em',
                      fontStyle: item.type === 'affirmation' ? 'italic' : 'normal',
                      fontWeight: item.type === 'goal' ? 600 : 400,
                    }}
                  >
                    {item.content || (item.type === 'image' ? 'Visual inspiration' : '')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
