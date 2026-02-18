import React, { useEffect, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

type Props = {
  text: string;
  style?: any;
  viewClassName?: string;
  textClassName?: string;
};

export const MiddleEllipsisText = ({
  text,
  style,
  viewClassName,
  textClassName,
}: Props) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [displayText, setDisplayText] = useState(text);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  useEffect(() => {
    if (!containerWidth || !text) {
      setDisplayText(text);
      return;
    }

    const original = text;

    const avgCharWidth = 8.5;
    const maxChars = Math.floor(containerWidth / avgCharWidth);

    if (original.length <= maxChars) {
      setDisplayText(original);
      return;
    }

    const charsToShow = Math.max(maxChars - 3, 0);
    const front = Math.ceil(charsToShow / 2);
    const back = Math.floor(charsToShow / 2);

    setDisplayText(
      front > 0 && back > 0
        ? `${original.slice(0, front)}...${original.slice(-back)}`
        : original
    );
  }, [text, containerWidth]);

  return (
    <ThemedView
      onLayout={onLayout}
      className={viewClassName}
      style={{ width: "100%" }}
    >
      <ThemedText
        className={textClassName}
        style={style}
      >
        {displayText}
      </ThemedText>
    </ThemedView>
  );
};
