const projects = [
    {
      title: "LanguageFlag",
      description: "LanguageFlag is a handy tool that displays a language flag on the screen whenever you change your keyboard layout. This utility can be useful for users who regularly work with different languages and keyboard layouts on their Mac, as it provides a visual indicator of the current layout in use. LanguageFlag works on macOS Catalina 10.15 or higher.",
      imageUrl: "images/languageflag_icon.png",
      projectUrl: "languageflag/index.html"
    },
  ];
  
  const projectsGrid = document.querySelector(".projects-grid");
  
  function createProjectCard(project) {
    const card = document.createElement("div");
    card.classList.add("project-card");
  
    const img = document.createElement("img");
    img.src = project.imageUrl;
    img.alt = project.title;
    card.appendChild(img);
  
    const title = document.createElement("h3");
    title.textContent = project.title;
    card.appendChild(title);
  
    const description = document.createElement("p");
    description.textContent = project.description;
    card.appendChild(description);
  
    const link = document.createElement("a");
    link.href = project.projectUrl;
    link.textContent = "View Project";
    link.classList.add("button");
    card.appendChild(link);
  
    return card;
  }
  
  projects.forEach(project => {
    const projectCard = createProjectCard(project);
    projectsGrid.appendChild(projectCard);
  });