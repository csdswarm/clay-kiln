function copyToClipboard(text) {
  // Create text area for copying
  const textArea = document.createElement("linktextarea");

  // Hide textArea
  textArea.style.position = 'fixed';
  textArea.top = 0;
  textArea.left = 0;

  textArea.width = '2em';
  textArea.height = '2em';

  textArea.style.padding = 0;

  textArea.border = 'none';
  textArea.outline = 'none';
  textArea.boxShadow = 'none';

  textArea.style.background = 'transparent';

  // Prepare text and textArea for copying
  textArea.value = text;
  document.body.appendChild(textArea);

  textArea.focus();
  textArea.select();

  try {
    // Copy text
    const successful = document.execCommand('copy');
    console.log('Copying successful?', successful);
  } catch (err) {
    console.log('Unable to copy');
  }

  // Remove textArea
  document.body.removeChild(textArea);
}