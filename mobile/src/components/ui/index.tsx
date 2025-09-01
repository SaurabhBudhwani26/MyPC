import React, { forwardRef } from 'react';
import { 
  Text, 
  TouchableOpacity, 
  View, 
  TextInput as RNTextInput, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  TextInputProps as RNTextInputProps
} from 'react-native';
import { styled } from 'nativewind';

// Styled components with NativeWind
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledTextInput = styled(RNTextInput);

// Modern Button Component
interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Button = forwardRef<TouchableOpacity, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}, ref) => {
  const baseClasses = 'flex-row items-center justify-center rounded-xl font-medium transition-all active:scale-95';
  
  const variantClasses = {
    primary: 'bg-primary-600 shadow-soft active:bg-primary-700',
    secondary: 'bg-gray-100 active:bg-gray-200 border border-gray-200',
    ghost: 'active:bg-gray-100',
    success: 'bg-success-600 shadow-glow-success active:bg-success-700',
    danger: 'bg-danger-600 active:bg-danger-700',
  };

  const sizeClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  const textVariantClasses = {
    primary: 'text-white',
    secondary: 'text-gray-700',
    ghost: 'text-gray-700',
    success: 'text-white',
    danger: 'text-white',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <StyledTouchableOpacity
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <ActivityIndicator 
          size="small" 
          color={variant === 'secondary' || variant === 'ghost' ? '#374151' : '#ffffff'} 
          style={{ marginRight: 8 }}
        />
      )}
      <StyledText className={`${textVariantClasses[variant]} ${textSizeClasses[size]} font-semibold`}>
        {children}
      </StyledText>
    </StyledTouchableOpacity>
  );
});

// Modern Card Component
interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glass';
  className?: string;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'default', 
  className = '',
  onPress 
}) => {
  const baseClasses = 'rounded-2xl p-4 bg-white';
  
  const variantClasses = {
    default: 'border border-gray-100 shadow-soft',
    elevated: 'shadow-medium',
    glass: 'bg-white/10 backdrop-blur-lg border border-white/20',
  };

  const Component = onPress ? StyledTouchableOpacity : StyledView;

  return (
    <Component
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onPress={onPress}
      activeOpacity={onPress ? 0.95 : 1}
    >
      {children}
    </Component>
  );
};

// Modern Input Component
interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}, ref) => {
  return (
    <StyledView className="mb-4">
      {label && (
        <StyledText className="text-gray-700 text-sm font-medium mb-2">
          {label}
        </StyledText>
      )}
      <StyledView className={`flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border ${error ? 'border-danger-300' : 'border-gray-200'} ${className}`}>
        {leftIcon && (
          <StyledView className="mr-3">
            {leftIcon}
          </StyledView>
        )}
        <StyledTextInput
          ref={ref}
          className="flex-1 text-gray-900 text-base"
          placeholderTextColor="#9CA3AF"
          {...props}
        />
        {rightIcon && (
          <StyledView className="ml-3">
            {rightIcon}
          </StyledView>
        )}
      </StyledView>
      {error && (
        <StyledText className="text-danger-500 text-sm mt-1">
          {error}
        </StyledText>
      )}
    </StyledView>
  );
});

// Modern Badge Component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'gray', 
  size = 'md',
  className = '' 
}) => {
  const baseClasses = 'rounded-full font-medium';
  
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    danger: 'bg-danger-100 text-danger-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <StyledView className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      <StyledText className={variantClasses[variant].split(' ')[1]}>
        {children}
      </StyledText>
    </StyledView>
  );
};

// Loading Skeleton Component
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = '20px', 
  className = '' 
}) => {
  return (
    <StyledView 
      className={`bg-gray-200 rounded animate-pulse ${className}`}
      style={{ width, height }}
    />
  );
};

// Modern Avatar Component
interface AvatarProps {
  source?: { uri: string } | number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  source, 
  size = 'md', 
  fallback,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-2xl',
  };

  return (
    <StyledView className={`${sizeClasses[size]} rounded-full bg-gray-200 items-center justify-center overflow-hidden ${className}`}>
      {source ? (
        <StyledView className="w-full h-full" />
      ) : (
        <StyledText className={`${textSizeClasses[size]} font-medium text-gray-600`}>
          {fallback || '?'}
        </StyledText>
      )}
    </StyledView>
  );
};

// Modern Divider Component
interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({ 
  orientation = 'horizontal', 
  className = '' 
}) => {
  const orientationClasses = {
    horizontal: 'h-px w-full',
    vertical: 'w-px h-full',
  };

  return (
    <StyledView className={`bg-gray-200 ${orientationClasses[orientation]} ${className}`} />
  );
};

// Modern Container Component
interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({ children, className = '' }) => {
  return (
    <StyledView className={`px-4 ${className}`}>
      {children}
    </StyledView>
  );
};

// Modern Stack Component for layout
interface StackProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  spacing?: number;
  className?: string;
}

export const Stack: React.FC<StackProps> = ({ 
  children, 
  direction = 'column', 
  spacing = 4,
  className = '' 
}) => {
  const directionClass = direction === 'row' ? 'flex-row' : 'flex-col';
  const spacingClass = direction === 'row' ? `space-x-${spacing}` : `space-y-${spacing}`;
  
  return (
    <StyledView className={`${directionClass} ${spacingClass} ${className}`}>
      {children}
    </StyledView>
  );
};
