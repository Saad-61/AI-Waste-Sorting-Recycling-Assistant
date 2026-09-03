import React from 'react';
import { Trash2, Recycle, AlertTriangle, HelpCircle, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';

export const ObjectCard = ({ item, onExplain, isSelected = false, onSelect }) => {
  const getBinIcon = (bin) => {
    switch (bin) {
      case 'Recyclable':
        return <Recycle className="w-5 h-5 text-emerald-400" />;
      case 'Organic':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'Hazardous':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      default:
        return <Trash2 className="w-5 h-5 text-slate-400" />;
    }
  };

  const getBinBadgeVariant = (bin) => {
    switch (bin) {
      case 'Recyclable':
        return 'success';
      case 'Organic':
        return 'warning';
      case 'Hazardous':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const confidencePercent = Math.round((item.confidence || 0) * 100);

  return (
    <Card
      hover
      onClick={onSelect}
      className={`relative cursor-pointer transition-all border ${
        isSelected
          ? 'border-emerald-500 bg-slate-800/80 shadow-emerald-500/10 shadow-lg ring-1 ring-emerald-500'
          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            {getBinIcon(item.bin)}
          </div>
          <div>
            <h4 className="font-bold text-white text-base capitalize">{item.label}</h4>
            <p className="text-xs text-slate-400 font-medium">{item.material || 'General waste'}</p>
          </div>
        </div>

        <Badge variant={getBinBadgeVariant(item.bin)}>
          {item.bin}
        </Badge>
      </div>

      {/* Confidence metric indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>AI Confidence</span>
          <span className="font-bold text-slate-200">{confidencePercent}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
      </div>

      {/* Disposal instructions */}
      {item.instructions && (
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 mb-4">
          <span className="font-semibold text-slate-400 block mb-0.5">Instructions:</span>
          {item.instructions}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
        <span className="text-xs text-slate-500">
          Recyclable: <strong className="text-slate-300">{item.recyclable}</strong>
        </span>

        {item.heatmap && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onExplain(item);
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 mr-1" />
            Explain AI
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ObjectCard;
