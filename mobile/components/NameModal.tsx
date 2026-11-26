import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  title: string;
  submitLabel: string;
  initialName?: string;
  initialDescription?: string;
  onClose: () => void;
  // Should throw an Error (with a readable message) when saving fails
  onSubmit: (name: string, description: string) => Promise<void>;
};

// Small pop-up with a name and a description, used to create and rename programs
export function NameModal({
  visible,
  title,
  submitLabel,
  initialName = '',
  initialDescription = '',
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start from the current values each time the pop-up opens
  useEffect(() => {
    if (visible) {
      setName(initialName);
      setDescription(initialDescription);
      setError(null);
      setSaving(false);
    }
  }, [visible, initialName, initialDescription]);

  const submit = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(name.trim(), description.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/60 justify-center px-6"
      >
        <View className="bg-[#142238] border border-[#263B55] rounded-3xl p-5">
          <Text className="text-[#F1F5FB] text-xl font-bold">{title}</Text>

          <Text className="text-[#91A5C0] text-xs mt-5 mb-2">NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Program name"
            placeholderTextColor="#7186A1"
            maxLength={150}
            autoFocus
            className="h-12 bg-[#0B1422] border border-[#263B55] rounded-xl px-4 text-[#F1F5FB]"
          />

          <Text className="text-[#91A5C0] text-xs mt-4 mb-2">DESCRIPTION (OPTIONAL)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What is this program for?"
            placeholderTextColor="#7186A1"
            maxLength={1000}
            multiline
            className="min-h-[72px] bg-[#0B1422] border border-[#263B55] rounded-xl px-4 py-3 text-[#F1F5FB]"
            style={{ textAlignVertical: 'top' }}
          />

          {error && <Text className="text-[#F2A0A0] text-xs mt-3">{error}</Text>}

          <View className="flex-row gap-3 mt-5">
            <TouchableOpacity
              onPress={onClose}
              disabled={saving}
              className="flex-1 h-12 rounded-xl border border-[#263B55] items-center justify-center"
            >
              <Text className="text-[#DCE6F4] font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={submit}
              disabled={saving}
              className="flex-1 h-12 rounded-xl bg-[#719AD1] items-center justify-center"
            >
              {saving ? <ActivityIndicator color="#0B1422" /> : <Text className="text-[#0B1422] font-bold">{submitLabel}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}