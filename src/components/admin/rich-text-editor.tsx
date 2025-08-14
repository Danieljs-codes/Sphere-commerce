import {
	IconBoldFill,
	IconBulletListFill,
	IconItalicFill,
	IconMinus,
	IconStrikeThroughFill,
	IconUnderlineFill,
} from "@intentui/icons";
import { IconListNumbers } from "@tabler/icons-react";
import { Underline } from "@tiptap/extension-underline";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Button } from "@ui/button";
import { Label } from "@ui/field";
import { ToggleGroup, ToggleGroupItem } from "@ui/toggle-group";
import { useEffect, useState } from "react";
import type { Key } from "react-aria-components";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
	label?: string;
	value?: string;
	onChange?: (value: string) => void;
	isRequired?: boolean;
	isInvalid?: boolean;
	errorMessage?: string;
}

export const RichTextEditor = ({
	label,
	value = "",
	onChange,
	isRequired = false,
	isInvalid = false,
	errorMessage,
}: RichTextEditorProps) => {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: false,
				blockquote: false,
				codeBlock: false,
				link: false,
				dropcursor: false,
			}),
			Underline,
		],
		immediatelyRender: false,
		content: value,
		onUpdate: ({ editor }) => {
			const html = editor.getHTML();
			if (html !== value) {
				onChange?.(html);
			}
		},
		editorProps: {
			attributes: {
				class: cn([
					"prose prose-sm max-w-none",
					"field-sizing-content min-h-32 w-full min-w-0 px-2.5 py-2 text-base placeholder-muted-fg outline-hidden sm:text-sm/6",
				]),
			},
		},
	});

	// Update editor content when value prop changes
	useEffect(() => {
		if (editor && value !== editor.getHTML()) {
			editor.commands.setContent(value, { emitUpdate: false });
		}
	}, [editor, value]);

	return (
		<div className="group flex flex-col gap-y-1 *:data-[slot=label]:font-medium">
			{label && (
				<Label>
					{label}
					{isRequired && <span className="text-danger ml-1">*</span>}
				</Label>
			)}
			<div
				className={cn([
					"field-sizing-content min-h-40 w-full min-w-0 rounded-lg border shadow-xs outline-hidden transition duration-200 overflow-hidden",
					"focus-within:border-ring/70 focus-within:ring-3 focus-within:ring-ring/20",
					"hover:border-current/20",
					isInvalid
						? "border-danger invalid:hover:border-danger/70"
						: "border-input",
				])}
			>
				<MenuBar editor={editor} />
				<div className="border-t border-input/50">
					<EditorContent editor={editor} />
				</div>
			</div>
			{errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}
		</div>
	);
};

function MenuBar({ editor }: { editor: Editor | null }) {
	const isMobile = useMediaQuery("(max-width: 640px)");
	const [formattingKeys, setFormattingKeys] = useState(new Set<Key>());
	const [listKeys, setListKeys] = useState(new Set<Key>());

	useEffect(() => {
		if (!editor) return;

		const updateSelection = () => {
			const newFormattingKeys = new Set<Key>();
			const newListKeys = new Set<Key>();

			if (editor.isActive("bold")) newFormattingKeys.add("bold");
			if (editor.isActive("italic")) newFormattingKeys.add("italic");
			if (editor.isActive("underline")) newFormattingKeys.add("underline");
			if (editor.isActive("strike")) newFormattingKeys.add("strike");

			if (editor.isActive("bulletList")) newListKeys.add("bullet-list");
			if (editor.isActive("orderedList")) newListKeys.add("ordered-list");

			setFormattingKeys(newFormattingKeys);
			setListKeys(newListKeys);
		};

		editor.on("selectionUpdate", updateSelection);
		editor.on("transaction", updateSelection);

		updateSelection();

		return () => {
			editor.off("selectionUpdate", updateSelection);
			editor.off("transaction", updateSelection);
		};
	}, [editor]);

	if (!editor) {
		return null;
	}

	const handleFormattingChange = (keys: Set<Key>) => {
		const currentKeys = formattingKeys;

		// Find the difference to determine what was toggled
		const added = [...keys].filter((key) => !currentKeys.has(key));
		const removed = [...currentKeys].filter((key) => !keys.has(key));

		// Toggle the formatting based on what changed
		if (added.length > 0) {
			const key = added[0];
			switch (key) {
				case "bold":
					editor.chain().focus().toggleBold().run();
					break;
				case "italic":
					editor.chain().focus().toggleItalic().run();
					break;
				case "underline":
					editor.chain().focus().toggleUnderline().run();
					break;
				case "strike":
					editor.chain().focus().toggleStrike().run();
					break;
			}
		} else if (removed.length > 0) {
			const key = removed[0];
			switch (key) {
				case "bold":
					editor.chain().focus().toggleBold().run();
					break;
				case "italic":
					editor.chain().focus().toggleItalic().run();
					break;
				case "underline":
					editor.chain().focus().toggleUnderline().run();
					break;
				case "strike":
					editor.chain().focus().toggleStrike().run();
					break;
			}
		}
	};

	const handleListChange = (keys: Set<Key>) => {
		const currentKeys = listKeys;

		// Find the difference to determine what was toggled
		const added = [...keys].filter((key) => !currentKeys.has(key));
		const removed = [...currentKeys].filter((key) => !keys.has(key));

		// Toggle the list based on what changed
		if (added.length > 0) {
			const key = added[0];
			switch (key) {
				case "bullet-list":
					editor.chain().focus().toggleBulletList().run();
					break;
				case "ordered-list":
					editor.chain().focus().toggleOrderedList().run();
					break;
			}
		} else if (removed.length > 0) {
			const key = removed[0];
			switch (key) {
				case "bullet-list":
					editor.chain().focus().toggleBulletList().run();
					break;
				case "ordered-list":
					editor.chain().focus().toggleOrderedList().run();
					break;
			}
		}
	};

	const addHorizontalRule = () => {
		editor.chain().focus().setHorizontalRule().run();
	};

	return (
		<div className="flex items-center px-2.5 py-2 bg-muted/20 gap-x-1.5 border-b border-input/50">
			<ToggleGroup
				size={isMobile ? "sq-xs" : "sq-sm"}
				selectionMode="multiple"
				selectedKeys={formattingKeys}
				onSelectionChange={handleFormattingChange}
			>
				<ToggleGroupItem id="bold">
					<IconBoldFill />
				</ToggleGroupItem>
				<ToggleGroupItem id="italic">
					<IconItalicFill />
				</ToggleGroupItem>
				<ToggleGroupItem id="underline">
					<IconUnderlineFill />
				</ToggleGroupItem>
				<ToggleGroupItem id="strike">
					<IconStrikeThroughFill />
				</ToggleGroupItem>
			</ToggleGroup>
			<ToggleGroup
				size={isMobile ? "sq-xs" : "sq-sm"}
				selectionMode="single"
				selectedKeys={listKeys}
				onSelectionChange={handleListChange}
			>
				<ToggleGroupItem id="bullet-list">
					<IconBulletListFill />
				</ToggleGroupItem>
				<ToggleGroupItem id="ordered-list">
					<IconListNumbers data-slot="icon" />
				</ToggleGroupItem>
			</ToggleGroup>
			<Button
				size={isMobile ? "sq-xs" : "sq-sm"}
				intent="outline"
				onPress={addHorizontalRule}
			>
				<IconMinus />
			</Button>
		</div>
	);
}
