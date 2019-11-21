const plugins = [
  require('postcss-import'),
  require('tailwindcss'),
  require('postcss-preset-env')({ stage: 1 }),
  require('autoprefixer'),
];

if (process.env.NODE_ENV === 'production') {
  // https://tailwindcss.com/docs/controlling-file-size
  plugins.push(
    require('@fullhuman/postcss-purgecss')({
      content: ['./client/**/*.tsx'],
      defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
    })
  );

  plugins.push(
    require('cssnano')({
      preset: [
        'default',
        {
          discardComments: {
            removeAll: true,
          },
        },
      ],
    })
  );
}

module.exports = {
  plugins,
};
