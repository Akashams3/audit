import React from 'react';
import Modal from './Modal';

const SchedulePreviewModal = ({ isOpen, onClose, onConfirm, scheduleData, loading }) => {
  if (!scheduleData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Audit Schedule Preview">
      <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-800">
          <strong>Review Schedule Details:</strong> Please verify the generated dates and assigned parameters before publishing.
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-semibold text-gray-600 block">Title</span>
              <span className="text-gray-900 font-medium">{scheduleData.title}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-600 block">Department</span>
              <span className="text-gray-900 font-medium">{scheduleData.departmentCode || 'ALL'}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-600 block">Audit Date</span>
              <span className="text-gray-900 font-medium">{scheduleData.auditDate}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-600 block">Due Date</span>
              <span className="text-gray-900 font-medium">{scheduleData.dueDate}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-600 block">Audit Type</span>
              <span className="text-gray-900 font-medium">{scheduleData.auditType}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-600 block">Phase</span>
              <span className="text-gray-900 font-medium">{scheduleData.academicPhase || 'General'}</span>
            </div>
          </div>

          <div>
            <span className="font-semibold text-gray-600 text-sm block mb-1">Description</span>
            <p className="text-sm bg-gray-50 p-2.5 rounded border text-gray-700">
              {scheduleData.description || 'No description provided.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm font-medium"
          >
            Cancel / Edit
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold shadow"
          >
            {loading ? 'Confirming...' : 'Confirm & Publish Schedule'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SchedulePreviewModal;
