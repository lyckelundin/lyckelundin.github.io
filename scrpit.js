new Chart(document.getElementById('museumChart'), {
  type: 'bar',
  data: {
    labels: ['2016: Fri entré införs', '2023: Fri entré avskaffas'],
    datasets: [
      {
        label: 'Reformmuseer (fick/förlorade fri entré)',
        data: [50, -21],
        backgroundColor: '#2a78d6'
      },
      {
        label: 'Jämförbara museer (oförändrad avgift)',
        data: [6, 14],
        backgroundColor: '#c3c2b7'
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Fri entré infördes 2016 och avskaffades 2023 – effekt på museibesök'
      }
    },
    scales: {
      y: { title: { display: true, text: '% förändring i besök' } }
    }
  }
});