// The offscreen document supplies layout; keyboard input must scroll its HUD copy.
export function scrollDocumentKey(event, article, scrollTo) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return false;
  const current=article.scrollTop, page=article.clientHeight*.85;
  const destination={ArrowDown:current+48,ArrowUp:current-48,PageDown:current+page,PageUp:current-page,Home:0,End:article.scrollHeight-article.clientHeight}[event.key];
  if(destination===undefined)return false;
  event.preventDefault();event.stopPropagation();scrollTo(destination);return true;
}
