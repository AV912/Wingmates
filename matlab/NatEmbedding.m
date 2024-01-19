% import dataset and trim to have a vector of country names
opts = detectImportOptions("../countries.csv");
opts = setvartype(opts, ["name"], 'string');
opts.SelectedVariableNames = ["name"];
countries = table2array(readtable('../countries.csv', opts));

% word2vec embedding variable
emb = fastTextWordEmbedding;
% us = word2vec(emb,"United States", "IgnoreCase", true);

num_countries = length(countries);
country_embs = word2vec(emb, countries, "IgnoreCase", true);
dot_vals = country_embs*(country_embs');


for i=1:num_countries
    for j=1:num_countries
        dot_vals(i,j) = dot_vals(i,j) / (norm(country_embs(i,:)) * norm(country_embs(j,:)));
    end
end

save("country_dots.mat","dot_vals")
