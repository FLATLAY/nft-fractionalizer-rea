
// making navbar-brand removed when display is small
if (window.innerWidth < 768) {
  const navbarBrand = document.querySelector('.navbar-brand')
  navbarBrand.classList.add('d-none')
}