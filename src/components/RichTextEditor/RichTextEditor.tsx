import { useRef, useEffect, useCallback, useState } from 'react'
import {
  Bold,
  List,
  Minus,
  Highlighter,
  CheckSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { EmojiPicker } from './EmojiPicker'
import { decodeHtmlForEditor } from '@/lib/stripHtml'

const HIGHLIGHT_COLORS = [
  { name: 'צהוב', value: '#FFEB3B' },
  { name: 'ירוק', value: '#A5D6A7' },
  { name: 'כחול', value: '#90CAF9' },
  { name: 'ורוד', value: '#F48FB1' },
  { name: 'כתום', value: '#FFCC80' },
]

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'כתבי כאן...',
  minHeight = '180px',
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [showToolbar, setShowToolbar] = useState(false)
  const [showHighlightColors, setShowHighlightColors] = useState(false)
  const isInternalChange = useRef(false)

  const emitChange = useCallback(() => {
    if (!editorRef.current) return
    isInternalChange.current = true
    onChange(editorRef.current.innerHTML)
    setTimeout(() => { isInternalChange.current = false }, 0)
  }, [onChange])

  const toggleChecklist = useCallback((block: HTMLElement) => {
    const content = block.querySelector('.checklist-content')
    const icon = block.querySelector('.check-icon')
    const done = block.dataset.done === '1'
    const newDone = !done
    block.dataset.done = newDone ? '1' : '0'
    content?.classList.toggle('checklist-done', newDone)
    if (icon) icon.textContent = newDone ? '☑' : '☐'
    emitChange()
  }, [emitChange])

  // סנכרון ערך חיצוני לעורך + חיבור אירועי צ'קליסט
  useEffect(() => {
    if (!editorRef.current || isInternalChange.current) return
    const html = decodeHtmlForEditor(value || '')
    editorRef.current.innerHTML = html || ''
    const attachChecklistHandlers = () => {
      editorRef.current?.querySelectorAll('.checklist-block').forEach((blockEl) => {
        const block = blockEl as HTMLElement
        if (block.dataset.handlerAttached) return
        block.dataset.handlerAttached = '1'
        const content = block.querySelector('.checklist-content')
        const icon = block.querySelector('.check-icon')
        if (content && icon) {
          content.classList.toggle('checklist-done', block.dataset.done === '1')
        }
        const item = block.querySelector('.checklist-item')
        item?.addEventListener('click', (e) => {
          e.preventDefault()
          toggleChecklist(block)
        })
      })
      editorRef.current?.querySelectorAll('.checklist-item').forEach((itemEl) => {
        const item = itemEl as HTMLElement
        if (item.closest('.checklist-block')) return
        if (item.dataset.handlerAttached) return
        item.dataset.handlerAttached = '1'
        item.addEventListener('click', (e) => {
          e.preventDefault()
          const icon = item.querySelector('.check-icon')
          const done = item.dataset.done === '1'
          const newDone = !done
          item.dataset.done = newDone ? '1' : '0'
          if (icon) icon.textContent = newDone ? '☑' : '☐'
          emitChange()
        })
      })
    }
    attachChecklistHandlers()
  }, [value, emitChange, toggleChecklist])

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    editorRef.current?.focus()
    emitChange()
  }

  const insertChecklist = () => {
    const sel = window.getSelection()
    if (!sel || !editorRef.current) return
    const range = sel.getRangeAt(0)
    const block = document.createElement('div')
    block.className = 'checklist-block'
    block.dataset.done = '0'
    block.innerHTML = '<span class="checklist-item" contenteditable="false"><span class="check-icon">☐</span></span><span class="checklist-content">\u200B</span>'
    const item = block.querySelector('.checklist-item')!
    item.addEventListener('click', (e) => {
      e.preventDefault()
      toggleChecklist(block)
    })
    range.insertNode(block)
    const br = document.createElement('br')
    block.after(br)
    const content = block.querySelector('.checklist-content')!
    const r = document.createRange()
    r.setStart(content, 0)
    r.collapse(true)
    sel.removeAllRanges()
    sel.addRange(r)
    editorRef.current.focus()
    emitChange()
  }

  const handleEmojiSelect = (emoji: string) => {
    const sel = window.getSelection()
    if (!sel || !editorRef.current) return
    const range = sel.getRangeAt(0)
    const text = document.createTextNode(emoji)
    range.insertNode(text)
    range.setStartAfter(text)
    range.setEndAfter(text)
    sel.removeAllRanges()
    sel.addRange(range)
    editorRef.current.focus()
    emitChange()
  }

  const handleInput = () => emitChange()
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
    emitChange()
  }

  return (
    <div className={`rich-text-editor ${className}`}>
      <div
        ref={editorRef}
        contentEditable
        data-placeholder={placeholder}
        className="rich-editor-content w-full min-h-[180px] bg-transparent border-0 resize-none focus:outline-none [&:empty::before]:content-[attr(data-placeholder)] [&:empty::before]:text-muted"
        style={{ minHeight }}
        onInput={handleInput}
        onPaste={handlePaste}
        suppressContentEditableWarning
      />

      {/* סרגל כלים – מחדל מצומצם */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <EmojiPicker onSelect={handleEmojiSelect} />
        <button
          type="button"
          onClick={() => setShowToolbar(!showToolbar)}
          className="w-10 h-10 rounded-full bg-card shadow-soft flex items-center justify-center text-muted"
          aria-label={showToolbar ? 'סגור סרגל עריכה' : 'סרגל עריכה מתקדם'}
        >
          {showToolbar ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showToolbar && (
          <>
            <button
              type="button"
              onClick={() => exec('bold')}
              className="w-10 h-10 rounded-full bg-card shadow-soft flex items-center justify-center"
              aria-label="הדגשה"
            >
              <Bold size={18} strokeWidth={1.5} className="text-icon-primary" />
            </button>
            <button
              type="button"
              onClick={() => exec('insertUnorderedList')}
              className="w-10 h-10 rounded-full bg-card shadow-soft flex items-center justify-center"
              aria-label="רשימת bullets"
            >
              <List size={18} strokeWidth={1.5} className="text-icon-primary" />
            </button>
            <button
              type="button"
              onClick={() => exec('insertHorizontalRule')}
              className="w-10 h-10 rounded-full bg-card shadow-soft flex items-center justify-center"
              aria-label="קו מפריד"
            >
              <Minus size={18} strokeWidth={1.5} className="text-icon-primary" />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowHighlightColors(!showHighlightColors)}
                className="w-10 h-10 rounded-full bg-card shadow-soft flex items-center justify-center"
                aria-label="הדגשה צבעונית"
              >
                <Highlighter size={18} strokeWidth={1.5} className="text-icon-highlight" />
              </button>
              {showHighlightColors && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowHighlightColors(false)}
                    aria-hidden
                  />
                  <div className="absolute bottom-full left-0 mb-1 z-40 flex gap-1 p-2 bg-card rounded-xl shadow-lg border border-muted/20">
                    {HIGHLIGHT_COLORS.map(({ name, value }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          exec('hiliteColor', value)
                          setShowHighlightColors(false)
                        }}
                        className="w-8 h-8 rounded-lg border-2 border-white shadow"
                        style={{ backgroundColor: value }}
                        aria-label={name}
                        title={name}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={insertChecklist}
              className="w-10 h-10 rounded-full bg-card shadow-soft flex items-center justify-center"
              aria-label="צ'קליסט"
            >
              <CheckSquare size={18} strokeWidth={1.5} className="text-icon-primary" />
            </button>
          </>
        )}
      </div>

      <style>{`
        .rich-editor-content ul { padding-right: 1.5em; margin: 0.5em 0; }
        .rich-editor-content li { margin: 0.25em 0; }
        .rich-editor-content hr { border: none; border-top: 1px solid var(--muted); margin: 0.75em 0; }
        .checklist-block { display: flex; align-items: flex-start; gap: 6px; margin: 0.4em 0; }
        .checklist-item { cursor: pointer; user-select: none; flex-shrink: 0; }
        .checklist-content { flex: 1; min-width: 0; }
        .checklist-content.checklist-done { text-decoration: line-through; color: var(--muted); }
        .check-icon { margin-left: 2px; }
      `}</style>
    </div>
  )
}
