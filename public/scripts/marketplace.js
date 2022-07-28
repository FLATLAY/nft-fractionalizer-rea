const cardBodies = document.querySelectorAll('.market-card-body')

cardBodies.forEach((card) => {

  const size = card.textContent.length

  // making navbar-brand removed when display is small
  if (window.innerWidth < 768) {
    card.textContent = card.textContent.slice(0, 140)
    if (size > 140)
      card.textContent += ' ...'
  }
  else {
    card.textContent = card.textContent.slice(0, 250)
    if (size > 250)
      card.textContent += ' ...'
  }
})