import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface TabsProps {
  defaultValue: string;
  value?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
  // You can add a style prop if needed
  style?: ViewStyle;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
}

const TabsContext = React.createContext<{
  value: string;
  onChange: (value: string) => void;
}>({ value: '', onChange: () => {} });

export function Tabs({ defaultValue, value, onChange, children, style }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  const currentValue = value !== undefined ? value : activeTab;

  const handleTabChange = (newValue: string) => {
    setActiveTab(newValue);
    onChange?.(newValue);
  };

  const contextValue = React.useMemo(() => ({
    value: currentValue,
    onChange: handleTabChange,
  }), [currentValue]);

  return (
    <View style={[styles.container, style]}>
      <TabsContext.Provider value={contextValue}>
        {children}
      </TabsContext.Provider>
    </View>
  );
}

export function TabsList({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.tabsList, style]}>{children}</View>;
}

export function TabsTrigger({ value, children, style, textStyle }: TabsTriggerProps) {
  const { value: currentValue, onChange } = React.useContext(TabsContext);
  const isActive = currentValue === value;

  return (
    <TouchableOpacity
      onPress={() => onChange(value)}
      style={[
        styles.trigger,
        isActive ? styles.triggerActive : styles.triggerInactive,
        style,
      ]}
    >
      <Text
        style={[
          styles.triggerText,
          isActive ? styles.triggerTextActive : styles.triggerTextInactive,
          textStyle,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

export function TabsContent({ value, children }: TabsContentProps) {
  const { value: currentValue } = React.useContext(TabsContext);
  if (currentValue === value) {
    return <View style={styles.content}>{children}</View>;
  }
  return null;
}

const styles = StyleSheet.create({
  container: {
    // You can add container styles if needed
  },
  tabsList: {
    flexDirection: 'row',
  },
  trigger: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  triggerActive: {
    backgroundColor: '#06B6D4', // cyan-400
  },
  triggerInactive: {
    backgroundColor: 'transparent',
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  triggerTextActive: {
    color: '#1F2937', // gray-900
  },
  triggerTextInactive: {
    color: '#9CA3AF', // gray-400
  },
  content: {
    marginTop: 8,
  },
});
