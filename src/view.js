const render = (path, value, err) => {
  const input = document.querySelector('.form-control');
  const feedBackParagraf = document.querySelector('.feedback');
  if (path === 'formState') {
    if (value === 'valid') {
      feedBackParagraf.classList.add('text-success');
      feedBackParagraf.classList.remove('text-danger');
      feedBackParagraf.textContent = 'RSS успешно загружен';
      input.classList.remove('is-invalid');
    } else if (value === 'invalid') {
      input.classList.add('is-invalid');
      feedBackParagraf.classList.add('text-success');
      feedBackParagraf.classList.add('text-danger');
      feedBackParagraf.textContent = err;
    }
  }
};

export default render;
